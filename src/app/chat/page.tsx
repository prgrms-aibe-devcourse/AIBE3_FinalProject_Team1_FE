"use client";

import type { IMessage } from "@stomp/stompjs";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { differenceInMinutes, format, isSameDay, isToday } from "date-fns";
import { ko } from "date-fns/locale";
import { Suspense } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import type { ChatMessageDto } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";
/* ======================
   유틸 함수
====================== */
import { parseLocalDateString } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useStomp } from "@/hooks/useStomp";

import { markChatRoomAsRead } from "@/api/endpoints/chat";

import { useChatStore } from "@/store/chatStore";

import {
  useChatMessagesQuery,
  useChatRoomListQuery,
  useMarkAsReadMutation,
  useSendChatMessageMutation,
} from "@/queries/chat";
import { useMeQuery } from "@/queries/user";

import { MessageSquare, Send, User } from "lucide-react";

function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? parseLocalDateString(date) : date;
  return format(d, "a h:mm", { locale: ko });
}

function formatLastMessageTime(date?: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseLocalDateString(date) : date;

  const mins = differenceInMinutes(new Date(), d);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  if (isToday(d)) return format(d, "HH:mm", { locale: ko });

  return format(d, "yyyy.MM.dd", { locale: ko });
}

// 날짜 구분선 포맷팅 함수
function formatDateDivider(date: Date | string): string {
  const d = typeof date === "string" ? parseLocalDateString(date) : date;
  return format(d, "yyyy년 M월 d일 EEEE", { locale: ko });
}

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPage />
    </Suspense>
  );
}

/* ======================
   ChatPage
====================== */
function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get("roomId");

  const queryClient = useQueryClient();

  // ⭐ 자동 스크롤 제어용
  const initialScrollDone = useRef(false);
  const isUserScrollingUpRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    roomIdParam ? Number(roomIdParam) : null,
  );
  const [message, setMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: me } = useMeQuery();

  /* ======================
     채팅방 목록
  ====================== */
  const { data: chatRoomsInitial = [], isLoading: chatRoomsLoading } =
    useChatRoomListQuery();

  const chatRooms = useChatStore((state) => state.rooms);
  const setRooms = useChatStore((state) => state.setRooms);
  const setCurrentRoomId = useChatStore((state) => state.setCurrentRoomId);
  const resetUnread = useChatStore((state) => state.resetUnread);
  const updateRoom = useChatStore((state) => state.updateRoom);
  // selectedRoomId가 변경될 때 chatStore에 동기화
  useEffect(() => {
    setCurrentRoomId(selectedRoomId);

    // 컴포넌트 unmount 시 currentRoomId 초기화
    return () => {
      setCurrentRoomId(null);
    };
  }, [selectedRoomId, setCurrentRoomId]);

  useEffect(() => {
    // chatRoomsInitial이 실제로 변경되었을 때만 업데이트
    if (chatRoomsInitial.length > 0 || chatRooms.length === 0) {
      setRooms(chatRoomsInitial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRoomsInitial]);

  /* ======================
     메시지 페이지네이션
  ====================== */
  useEffect(() => {
    if (!selectedRoomId) return;

    // 🔥 메시지 캐시 무효화 (캐시 유지하면서 백그라운드 refetch)
    queryClient.invalidateQueries({
      queryKey: getQueryKey(queryKeys.chat.messages(selectedRoomId)),
      refetchType: "active", // 현재 활성화된 쿼리만 refetch
    });

    // 🔥 채팅방 변경 시 스크롤 플래그 초기화
    initialScrollDone.current = false;
    shouldAutoScrollRef.current = true;
    isUserScrollingUpRef.current = false;
  }, [selectedRoomId, queryClient]);

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessagesQuery(selectedRoomId);

  // ⭐ 다시 정의해줘야 하는 부분
  const handleFetchNextPage = useCallback(() => {
    if (!selectedRoomId) return;
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [selectedRoomId, hasNextPage, isFetchingNextPage, fetchNextPage]);

  /* ======================
     메시지 정리
  ====================== */
  const messages = (() => {
    const flat = messagesData
      ? messagesData.pages.flatMap((pg) => pg.content || [])
      : [];

    const seen = new Set<number>();
    const deduped: ChatMessageDto[] = [];

    for (const m of flat) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        deduped.push(m);
      }
    }

    return deduped.sort(
      (a, b) =>
        parseLocalDateString(a.createdAt).getTime() -
        parseLocalDateString(b.createdAt).getTime(),
    );
  })();

  /* ======================
     메시지 ID 추적
  ====================== */
  const lastMessageIdByRoom = useRef<Record<number, number | null>>({});
  const lastMarkedMessageIdByRoom = useRef<Record<number, number | null>>({});
  const prevRoomRef = useRef<number | null>(null);
  const selectedRoomIdRef = useRef<number | null>(selectedRoomId);
  const hasEnterReadRunRef = useRef(false);
  const markAsReadTimerByRoomRef = useRef<Record<number, NodeJS.Timeout>>({});
  const prevMessagesLengthRef = useRef<number>(0);
  const isInitialRoomEntryRef = useRef(false); // 첫 진입 여부

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    if (!selectedRoomId || messages.length === 0) return;
    const lastId = messages[messages.length - 1].id;
    lastMessageIdByRoom.current[selectedRoomId] = lastId;
  }, [messages, selectedRoomId]);

  /* ======================
     읽음 처리
  ====================== */
  const markAsReadMutation = useMarkAsReadMutation();

  const markRoomAsRead = useCallback(
    (roomId: number) => {
      const lastId = lastMessageIdByRoom.current[roomId];
      const prev = lastMarkedMessageIdByRoom.current[roomId];

      console.log("[READ] markRoomAsRead called", { roomId, lastId, prev });

      if (!lastId) {
        console.log("[READ] ❌ Skip: no lastId");
        return;
      }
      if (prev && prev >= lastId) {
        console.log("[READ] ❌ Skip: already marked", { prev, lastId });
        return;
      }

      console.log("🔥 [READ] Marking as read", { roomId, lastId });

      lastMarkedMessageIdByRoom.current[roomId] = lastId;

      markAsReadMutation.mutate({ roomId, lastMessageId: lastId });
    },
    [markAsReadMutation],
  );

  /* ======================
     ENTER / EXIT 방 처리
  ====================== */
  useEffect(() => {
    const prev = prevRoomRef.current;
    const curr = selectedRoomId;

    if (prev && prev !== curr) {
      console.log("🚪 [READ] EXIT ROOM", prev, "→ calling markRoomAsRead");
      markRoomAsRead(prev);
    }

    if (curr && prev !== curr) {
      console.log("👀 [READ] ENTER ROOM", curr, "→ resetUnread + reset flag");

      // 먼저 로컬 store에서 unreadCount를 0으로 설정
      resetUnread(curr);
      hasEnterReadRunRef.current = false;
      shouldAutoScrollRef.current = true; // 자동 스크롤 활성화

      // 그 다음 채팅방 목록 refetch (setRooms에서 currentRoomId 체크로 0 유지)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.rooms),
      });
    }

    prevRoomRef.current = curr ?? null;
  }, [selectedRoomId, markRoomAsRead, resetUnread, queryClient]);

  /* ======================
     ENTER 시 읽음 처리 1번만
  ====================== */
  useEffect(() => {
    if (!selectedRoomId) return;
    if (messages.length === 0) return;
    if (hasEnterReadRunRef.current) return;

    hasEnterReadRunRef.current = true;
    console.log("👁️ [READ] ENTER READ after messages loaded", {
      roomId: selectedRoomId,
      messageCount: messages.length,
    });
    markRoomAsRead(selectedRoomId);
    resetUnread(selectedRoomId);
  }, [selectedRoomId, messages.length, markRoomAsRead, resetUnread]);

  /* ======================
     언마운트 fallback
  ====================== */
  useEffect(() => {
    // cleanup 함수에서 사용할 값들을 effect 내부에서 미리 저장
    const roomId = prevRoomRef.current;
    const lastId = roomId ? lastMessageIdByRoom.current[roomId] : undefined;
    const prevMarked = roomId
      ? lastMarkedMessageIdByRoom.current[roomId]
      : undefined;

    return () => {
      const hot =
        "hot" in import.meta ? (import.meta as { hot?: unknown }).hot : false;

      if (hot) return;
      if (!roomId || !lastId) return;
      if (prevMarked && prevMarked >= lastId) return;

      console.log("🔥 READ (unmount fallback)", { roomId, lastId });
      markChatRoomAsRead(roomId, lastId).catch(console.error);
    };
  }, []);

  /* ======================
     STOMP 설정
  ====================== */
  const sendMessageMutation = useSendChatMessageMutation();
  const { isConnected, subscribe, publish } = useStomp();

  /* 메시지 구독 */
  useEffect(() => {
    if (!selectedRoomId || !isConnected) return;

    const dest = `/sub/chat/${selectedRoomId}`;
    const subId = `chat-page-${Date.now()}`;
    console.log("🔔 STOMP SUB", { dest, subId });

    const unsub = subscribe(dest, (msg: IMessage) => {
      const parsed = JSON.parse(msg.body) as ChatMessageDto;
      const roomId = selectedRoomId;

      console.log("💬 RECEIVE MESSAGE", {
        roomId,
        msgId: parsed.id,
      });

      queryClient.setQueryData(
        getQueryKey(queryKeys.chat.messages(roomId)),
        (old: InfiniteData<{ content: ChatMessageDto[] }> | null) => {
          if (!old) return old;

          const exists = old.pages.some((pg) =>
            pg.content.some((m: ChatMessageDto) => m.id === parsed.id),
          );
          if (exists) {
            console.log(
              "💬 [DUPLICATE] Message already exists, skipping",
              parsed.id,
            );
            return old;
          }

          const pages = [...old.pages];

          // 낙관적 업데이트로 추가된 tempMessage 제거 (ID가 1억 이상인 경우)
          pages[0] = {
            ...pages[0],
            content: pages[0].content.filter(
              (m: ChatMessageDto) => m.id < 1000000000000,
            ),
          };

          // 실제 메시지 추가
          pages[0] = {
            ...pages[0],
            content: [parsed, ...pages[0].content],
          };

          return { ...old, pages };
        },
      );

      lastMessageIdByRoom.current[roomId] = parsed.id;

      // Zustand store 직접 호출
      useChatStore.getState().updateRoom(roomId, (room) => ({
        ...room,
        lastMessage: parsed.content,
        lastMessageTime: parsed.createdAt,
        unreadCount: 0,
      }));

      useChatStore.getState().resetUnread(roomId);

      // 읽음 처리는 메시지 수신마다 하지 않고, 일정 시간 후 한 번만 처리
      // (디바운스: 마지막 메시지 이후 1초 대기)
      if (markAsReadTimerByRoomRef.current[roomId]) {
        clearTimeout(markAsReadTimerByRoomRef.current[roomId]);
        console.log("⏱️ [READ] Timer cancelled, will restart", { roomId });
      }
      console.log("⏱️ [READ] Starting new timer (1000ms)", {
        roomId,
        msgId: parsed.id,
      });
      markAsReadTimerByRoomRef.current[roomId] = setTimeout(() => {
        const lastId = lastMessageIdByRoom.current[roomId];
        const prev = lastMarkedMessageIdByRoom.current[roomId];
        console.log("💬 [READ] Debounced mark as read FIRED after 1000ms", {
          roomId,
          lastId,
          prev,
        });
        if (lastId && (!prev || prev < lastId)) {
          console.log("🔥 [READ] Marking as read", { roomId, lastId });
          lastMarkedMessageIdByRoom.current[roomId] = lastId;
          markAsReadMutation.mutate({ roomId, lastMessageId: lastId });
        }
      }, 1000);

      // 새 메시지를 받을 때, 사용자가 맨 아래에 있으면 자동 스크롤 가능
      shouldAutoScrollRef.current = true;
    });

    // cleanup 함수에서 사용할 ref 값 복사 (effect 내부에서)
    const timerRef = markAsReadTimerByRoomRef.current;
    const currentSelectedRoomId = selectedRoomId;

    return () => {
      console.log("🔕 STOMP UNSUB", { dest, subId });
      if (timerRef[currentSelectedRoomId]) {
        clearTimeout(timerRef[currentSelectedRoomId]);
        delete timerRef[currentSelectedRoomId];
      }
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId, isConnected, subscribe, queryClient]);

  /* ======================
     메시지 전송
  ====================== */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !message.trim() || !me?.id) return;

    const trimmed = message.trim();
    setMessage("");

    // 낙관적 업데이트: 임시 메시지 즉시 표시
    const tempId = Date.now(); // 임시 ID
    const tempMessage: ChatMessageDto = {
      id: tempId,
      authorId: me.id,
      content: trimmed,
      createdAt: new Date(),
    };

    // 메시지 목록에 즉시 추가
    queryClient.setQueryData(
      getQueryKey(queryKeys.chat.messages(selectedRoomId)),
      (old: InfiniteData<{ content: ChatMessageDto[] }> | null) => {
        if (!old) return old;

        const pages = [...old.pages];
        pages[0] = {
          ...pages[0],
          content: [tempMessage, ...(pages[0].content || [])],
        };

        return { ...old, pages };
      },
    );

    try {
      if (isConnected) {
        publish(`/pub/chat/${selectedRoomId}`, { content: trimmed });
      } else {
        await sendMessageMutation.mutateAsync({
          roomId: selectedRoomId,
          content: trimmed,
        });
      }

      // 메시지 전송 후 스크롤을 맨 아래로
      setTimeout(() => {
        const container = messagesEndRef.current?.parentElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
          shouldAutoScrollRef.current = true; // 자동 스크롤 활성화
        }
      }, 100);
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      // REST API 폴백
      try {
        await sendMessageMutation.mutateAsync({
          roomId: selectedRoomId,
          content: trimmed,
        });
      } catch (restError) {
        console.error("REST API 폴백도 실패:", restError);

        // 실패 시 임시 메시지 제거
        queryClient.setQueryData(
          getQueryKey(queryKeys.chat.messages(selectedRoomId)),
          (old: InfiniteData<{ content: ChatMessageDto[] }> | null) => {
            if (!old) return old;

            const pages = [...old.pages];
            pages[0] = {
              ...pages[0],
              content: pages[0].content.filter((m) => m.id !== tempId),
            };

            return { ...old, pages };
          },
        );

        setMessage(trimmed); // 입력값 복원
        return;
      }
    }

    updateRoom(selectedRoomId, (room) => ({
      ...room,
      lastMessage: trimmed,
      lastMessageTime: new Date(),
      unreadCount: 0,
    }));
    resetUnread(selectedRoomId);
  };

  /* URL sync */
  useEffect(() => {
    if (selectedRoomId) {
      const param = String(selectedRoomId);
      if (roomIdParam !== param) {
        router.replace(`/chat?roomId=${selectedRoomId}`, { scroll: false });
      }
    }
  }, [selectedRoomId, roomIdParam, router]);

  useEffect(() => {
    if (roomIdParam) setSelectedRoomId(Number(roomIdParam));
  }, [roomIdParam]);

  /* ======================
     자동 스크롤 (🔥 수정된 부분)
  ====================== */
  // 채팅방 진입 시 맨 아래로 스크롤 (메시지 로드 완료 후)
  useEffect(() => {
    if (!selectedRoomId || messages.length === 0) return;

    console.log("📜 [SCROLL] Scrolling to bottom", {
      roomId: selectedRoomId,
      messagesCount: messages.length,
    });

    // 첫 진입 플래그 설정
    isInitialRoomEntryRef.current = true;
    prevMessagesLengthRef.current = messages.length; // 현재 길이로 초기화

    // 즉시 스크롤 (딜레이 없음)
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      // requestAnimationFrame을 사용하여 렌더링 직후 즉시 스크롤
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        console.log("📜 [SCROLL] Scrolled to bottom", {
          scrollTop: container.scrollTop,
          scrollHeight: container.scrollHeight,
        });
        // 스크롤 완료 후 플래그 해제
        isInitialRoomEntryRef.current = false;
      });
    }

    return () => {
      isInitialRoomEntryRef.current = false;
    };
  }, [selectedRoomId, messages.length]);

  // 새 메시지 도착 시 자동 스크롤 (사용자가 아래에 있을 때만)
  useEffect(() => {
    if (messages.length === 0) return;

    // 첫 진입 중이면 스킵 (위의 useEffect에서 처리)
    if (isInitialRoomEntryRef.current) {
      console.log("📜 [SCROLL] Initial entry, skipping new message scroll");
      return;
    }

    const prevLength = prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    // 사용자가 위로 스크롤한 상태면 자동 스크롤 안 함
    if (!shouldAutoScrollRef.current) return;

    // 메시지가 증가했을 때만 스크롤 (새 메시지 도착)
    if (messages.length > prevLength) {
      console.log("📜 [SCROLL] New message, auto-scrolling", {
        prev: prevLength,
        current: messages.length,
      });

      const timer = setTimeout(() => {
        const container = messagesEndRef.current?.parentElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  /* ======================
     UI
  ====================== */
  const selectedRoom = chatRooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex gap-4 h-[calc(100vh-14rem)]">
        {/* Left: Room list */}
        <Card className="w-80 flex-shrink-0 flex flex-col h-full">
          <CardContent className="!p-0 flex flex-col h-full overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-semibold">채팅</h2>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {chatRoomsLoading ? (
                <div className="flex items-center justify-center h-full">
                  로딩 중...
                </div>
              ) : chatRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="h-8 w-8" />
                  <p>채팅방이 없습니다</p>
                </div>
              ) : (
                chatRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full py-4 border-b border-gray-100 hover:bg-gray-50 text-left ${
                      selectedRoomId === room.id ? "bg-gray-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4">
                      <div className="relative h-12 w-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                        {room.otherMember?.profileImgUrl ? (
                          <Image
                            src={room.otherMember.profileImgUrl}
                            alt={room.otherMember.nickname}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* 상단: 닉네임 + 읽지 않음 카운트 */}
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm truncate">
                            {room.otherMember?.nickname}
                          </span>

                          {room.id !== selectedRoomId &&
                            (room.unreadCount ?? 0) > 0 && (
                              <span className="text-xs bg-red-500 text-white rounded-full h-5 min-w-5 px-2 flex items-center justify-center">
                                {room.unreadCount}
                              </span>
                            )}
                        </div>

                        {/* 🔵 게시글 제목 (항상 표시) */}
                        <span className="text-[11px] text-blue-500 font-medium block truncate mt-[2px]">
                          {room.post.title}
                        </span>

                        {/* 최근 메시지가 있을 때만 */}
                        {room.lastMessage && (
                          <div className="flex gap-2 items-center mt-[4px]">
                            {/* 🟣 최근 메시지 내용: 더 크고 조금 더 진하게 */}
                            <span className="text-sm text-gray-800 font-medium truncate">
                              {room.lastMessage}
                            </span>

                            {/* ⏱ 시간 */}
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {formatLastMessageTime(room.lastMessageTime)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Messages */}
        <Card className="flex-1 flex flex-col h-full">
          <CardContent className="!p-0 flex flex-col h-full overflow-hidden">
            {selectedRoom ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
                  <div className="relative h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                    {selectedRoom.otherMember?.profileImgUrl ? (
                      <Image
                        src={selectedRoom.otherMember.profileImgUrl}
                        alt={selectedRoom.otherMember.nickname}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {selectedRoom.otherMember?.nickname}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {selectedRoom.post.title}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
                  onScroll={(e) => {
                    const t = e.currentTarget;

                    // ⭐ 사용자가 위로 스크롤했는지 감지
                    if (t.scrollTop < t.scrollHeight - t.clientHeight - 50) {
                      isUserScrollingUpRef.current = true;
                      shouldAutoScrollRef.current = false;
                    } else {
                      isUserScrollingUpRef.current = false;
                      shouldAutoScrollRef.current = true;
                    }

                    // 위로 충분히 올렸을 때만 page=1 요청 (맨 위 20px 이내)
                    if (
                      t.scrollTop > 0 &&
                      t.scrollTop < 20 &&
                      hasNextPage &&
                      !isFetchingNextPage
                    ) {
                      console.log("📄 [SCROLL] Fetching previous page", {
                        scrollTop: t.scrollTop,
                      });
                      handleFetchNextPage();
                    }
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      메시지가 없습니다
                    </div>
                  ) : (
                    <>
                      {isFetchingNextPage && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          이전 메시지 로딩 중...
                        </div>
                      )}

                      {messages.map((msg, index) => {
                        const isMine = msg.authorId === me?.id;
                        const currentDate = parseLocalDateString(msg.createdAt);
                        const prevDate =
                          index > 0
                            ? parseLocalDateString(
                                messages[index - 1].createdAt,
                              )
                            : null;

                        // 날짜가 바뀌면 날짜 구분선 표시
                        const shouldShowDateDivider =
                          !prevDate || !isSameDay(currentDate, prevDate);

                        return (
                          <div key={msg.id} className="space-y-2">
                            {shouldShowDateDivider && (
                              <div className="flex items-center justify-center py-2">
                                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                  {formatDateDivider(msg.createdAt)}
                                </div>
                              </div>
                            )}
                            <div
                              className={`flex ${
                                isMine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md ${isMine ? "flex flex-col items-end gap-1" : "flex flex-col gap-1"}`}
                              >
                                <div
                                  className={`px-4 py-2 rounded-lg ${
                                    isMine
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-100 text-gray-900"
                                  }`}
                                >
                                  {msg.content}
                                </div>
                                <span
                                  className={`text-xs text-gray-500 px-2 ${isMine ? "text-right" : ""}`}
                                >
                                  {formatTimestamp(msg.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="메시지를 입력하세요..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button type="submit" disabled={!message.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto opacity-50" />
                  채팅방을 선택하세요
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
