"use client";

import type { IMessage } from "@stomp/stompjs";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { differenceInMinutes, format, isToday, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Suspense } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import type {
  ChatMessageDto,
  ChatNotiDto,
  ChatRoomListDto,
  NewMessageNotiDto,
  NewRoomNotiDto,
} from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import { useStomp } from "@/hooks/useStomp";

import { markChatRoomAsRead } from "@/api/endpoints/chat";

import {
  useChatMessagesQuery,
  useChatRoomListQuery,
  useMarkAsReadMutation,
  useSendChatMessageMutation,
} from "@/queries/chat";
import { useMeQuery } from "@/queries/user";

import { MessageSquare, Send, User } from "lucide-react";

/* ======================
   유틸 함수
====================== */
import { parseLocalDate } from "@/lib/utils";

function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? parseLocalDate(date) : date;
  return format(d, "a h:mm", { locale: ko });
}

function formatLastMessageTime(date?: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseLocalDate(date) : date;

  const mins = differenceInMinutes(new Date(), d);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  if (isToday(d)) return format(d, "HH:mm", { locale: ko });

  return format(d, "yyyy.MM.dd", { locale: ko });
}

// 날짜 구분선 포맷팅 함수
function formatDateDivider(date: Date | string): string {
  const d = typeof date === "string" ? parseLocalDate(date) : date;
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

  /* ⭐ 채팅 페이지 처음 들어올 때 목록 강제 refetch */
  useEffect(() => {
    const key = getQueryKey(queryKeys.chat.rooms);
    console.log("[ChatPage] invalidate chat rooms on mount:", key);
    queryClient.invalidateQueries({ queryKey: key });
  }, [queryClient]);

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

  const [chatRooms, setChatRooms] = useState<ChatRoomListDto[]>([]);

  useEffect(() => {
    setChatRooms(chatRoomsInitial);
  }, [chatRoomsInitial]);

  /* ======================
     메시지 페이지네이션
  ====================== */
  useEffect(() => {
    if (!selectedRoomId) return;

    // 🔥 메시지 페이지 캐시 리셋 (중요!)
    queryClient.removeQueries({
      queryKey: getQueryKey(queryKeys.chat.messages(selectedRoomId)),
    });
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
        parseLocalDate(a.createdAt).getTime() - parseLocalDate(b.createdAt).getTime(),
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

      if (!lastId) return;
      if (prev && prev >= lastId) return;

      console.log("🔥 READ", { roomId, lastId });

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
      console.log("🚪 EXIT ROOM", prev);
      markRoomAsRead(prev);
    }

    if (curr && prev !== curr) {
      console.log("👀 ENTER ROOM", curr);

      setChatRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === curr ? { ...room, unreadCount: 0 } : room,
        ),
      );

      hasEnterReadRunRef.current = false;
    }

    prevRoomRef.current = curr ?? null;
  }, [selectedRoomId, markRoomAsRead]);

  /* ======================
     ENTER 시 읽음 처리 1번만
  ====================== */
  useEffect(() => {
    if (!selectedRoomId) return;
    if (messages.length === 0) return;
    if (hasEnterReadRunRef.current) return;

    hasEnterReadRunRef.current = true;
    console.log("👁️ ENTER READ after messages loaded", {
      roomId: selectedRoomId,
    });
    markRoomAsRead(selectedRoomId);
  }, [selectedRoomId, messages.length, markRoomAsRead]);

  /* ======================
     언마운트 fallback
  ====================== */
  useEffect(() => {
    return () => {
      const hot =
        "hot" in import.meta ? (import.meta as { hot?: unknown }).hot : false;

      if (hot) return;

      const roomId = prevRoomRef.current;
      if (!roomId) return;

      const lastId = lastMessageIdByRoom.current[roomId];
      const prevMarked = lastMarkedMessageIdByRoom.current[roomId];

      if (!lastId) return;
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

  const handleIncomingMessage = useCallback(
    (msg: IMessage, subscribedRoomId: number) => {
      const parsed = JSON.parse(msg.body) as ChatMessageDto;
      const roomId = subscribedRoomId;

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
          if (exists) return old;

          const pages = [...old.pages];
          pages[0] = {
            ...pages[0],
            content: [parsed, ...(pages[0].content || [])],
          };

          return { ...old, pages };
        },
      );

      lastMessageIdByRoom.current[roomId] = parsed.id;

      // 새 메시지를 받을 때, 사용자가 맨 아래에 있으면 자동 스크롤 가능
      shouldAutoScrollRef.current = true;
    },
    [queryClient],
  );

  /* 메시지 구독 */
  useEffect(() => {
    if (!selectedRoomId || !isConnected) return;

    const dest = `/sub/chat/${selectedRoomId}`;
    console.log("🔔 STOMP SUB", dest);

    const unsub = subscribe(dest, (msg) =>
      handleIncomingMessage(msg, selectedRoomId),
    );

    return () => {
      console.log("🔕 STOMP UNSUB", dest);
      unsub();
    };
  }, [selectedRoomId, isConnected, subscribe, handleIncomingMessage]);

  /* ======================
     알림 구독
  ====================== */
  const handleNewRoom = useCallback((room: NewRoomNotiDto) => {
    setChatRooms((prev) => {
      if (prev.some((r) => r.id === room.id)) return prev;
      return [room, ...prev];
    });
  }, []);

  const handleNewMessageNoti = useCallback((payload: NewMessageNotiDto) => {
    const currentRoomId = selectedRoomIdRef.current;
    const isCurrentRoom = currentRoomId === payload.chatRoomId;

    setChatRooms((prev) =>
      prev.map((room) =>
        room.id !== payload.chatRoomId
          ? room
          : {
              ...room,
              lastMessage: payload.content,
              lastMessageTime: payload.createdAt,
              unreadCount: isCurrentRoom ? 0 : (room.unreadCount ?? 0) + 1,
            },
      ),
    );
  }, []);

  useEffect(() => {
    if (!isConnected || !me?.id) return;

    const dest = `/sub/notifications/${me.id}`;
    console.log("🔔 STOMP SUB", dest);

    const unsub = subscribe(dest, (msg) => {
      try {
        const noti: ChatNotiDto = JSON.parse(msg.body);

        if (noti.type === "NEW_ROOM") {
          handleNewRoom(noti.payload as NewRoomNotiDto);
        } else if (noti.type === "NEW_MESSAGE") {
          handleNewMessageNoti(noti.payload as NewMessageNotiDto);
        }
      } catch (e) {
        console.error("Notification parse error:", e);
      }
    });

    return () => {
      console.log("🔕 STOMP UNSUB", dest);
      unsub();
    };
  }, [isConnected, me?.id, subscribe, handleNewRoom, handleNewMessageNoti]);

  /* ======================
     메시지 전송
  ====================== */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !message.trim()) return;

    const trimmed = message.trim();

    try {
      publish(`/pub/chat/${selectedRoomId}`, { content: trimmed });
      setMessage("");
    } catch {
      await sendMessageMutation.mutateAsync({
        roomId: selectedRoomId,
        content: trimmed,
      });
      setMessage("");
    }

    // ⭐ 내가 보낸 메시지를 채팅 목록에서도 즉시 업데이트 (방법 A)
    setChatRooms((prev) =>
      prev.map((room) =>
        room.id === selectedRoomId
          ? ({
              ...room,
              lastMessage: trimmed,
              lastMessageTime: new Date(), // 🔥 타입 맞춤
              unreadCount: 0,
            } as unknown as ChatRoomListDto) // ⭐ unknown → ChatRoomListDto 캐스팅
          : room,
      ),
    );
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
  useEffect(() => {
    if (messages.length === 0) return;

    // 1) 최초 1회 → 무조건 맨 아래
    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      messagesEndRef.current?.scrollIntoView();
      return;
    }

    // 2) 사용자가 위로 스크롤하면 자동 스크롤 금지
    if (!shouldAutoScrollRef.current) return;

    // 3) 새 메시지 오면 부드럽게 이동
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

                // 초기 scrollTop === 0 방지
                if (t.scrollTop === 0) return;

                // 위로 충분히 올렸을 때 page=1 요청
                if (t.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
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
                    const currentDate = parseLocalDate(msg.createdAt);
                    const prevDate =
                      index > 0
                        ? parseLocalDate(messages[index - 1].createdAt)
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
                          <div className="max-w-xs lg:max-w-md">
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isMine
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <span className="text-xs text-gray-500 px-2">
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
