"use client";

import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { differenceInMinutes, format, isToday } from "date-fns";
import { ko } from "date-fns/locale";
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
function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "HH:mm", { locale: ko });
}

function formatLastMessageTime(date?: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;

  const mins = differenceInMinutes(new Date(), d);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  if (isToday(d)) return format(d, "HH:mm", { locale: ko });

  return format(d, "yyyy.MM.dd", { locale: ko });
}

/* ======================
   ChatPage
====================== */
export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get("roomId");

  const queryClient = useQueryClient();

  /* ⭐ 채팅 페이지 처음 들어올 때 목록 강제 refetch
     - 이 페이지(unmount → mount) 들어올 때마다 1번 실행
  */
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

  // Query 결과를 로컬 상태에 반영 (알림/실시간 업데이트는 이 로컬 상태만 수정)
  useEffect(() => {
    setChatRooms(chatRoomsInitial);
  }, [chatRoomsInitial]);

  /* ======================
     메시지 페이지네이션
  ====================== */
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessagesQuery(selectedRoomId);

  const handleFetchNextPage = () => {
    if (!selectedRoomId) return;
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  };

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
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  })();

  /* ======================
     메시지 ID 추적
  ====================== */
  const lastMessageIdByRoom = useRef<Record<number, number | null>>({});
  const lastMarkedMessageIdByRoom = useRef<Record<number, number | null>>({});
  const prevRoomRef = useRef<number | null>(null);
  const selectedRoomIdRef = useRef<number | null>(selectedRoomId);
  const hasEnterReadRunRef = useRef(false); // 현재 방에 대해 "입장 읽음" 한번만 실행

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // 현재 방의 마지막 메시지 ID 갱신 (읽음 처리용 데이터만 업데이트)
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

      // 서버로 읽음 처리
      markAsReadMutation.mutate({ roomId, lastMessageId: lastId });
    },
    [markAsReadMutation],
  );

  /* ======================
     ENTER / EXIT 방 처리
     - ENTER: UI 상 unreadCount 0 처리
     - EXIT: 새로 쌓인 메시지가 있으면 READ
  ====================== */
  useEffect(() => {
    const prev = prevRoomRef.current;
    const curr = selectedRoomId;

    // 이전 방에서 나갈 때: 읽음 처리
    if (prev && prev !== curr) {
      console.log("🚪 EXIT ROOM", prev);
      markRoomAsRead(prev);
    }

    // 새로운 방으로 들어갈 때
    if (curr && prev !== curr) {
      console.log("👀 ENTER ROOM", curr);

      // UI에서 먼저 뱃지 제거
      setChatRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === curr ? { ...room, unreadCount: 0 } : room,
        ),
      );

      // 새 방으로 들어올 때마다 "입장 읽음" 플래그 초기화
      hasEnterReadRunRef.current = false;
    }

    prevRoomRef.current = curr ?? null;
  }, [selectedRoomId, markRoomAsRead]);

  /* ======================
     ENTER 시점 읽음 처리 (메시지가 로딩된 뒤 1번만)
  ====================== */
  useEffect(() => {
    if (!selectedRoomId) return;
    if (messages.length === 0) return;
    if (hasEnterReadRunRef.current) return;

    // 현재 방에 대해 "입장 읽음" 딱 1번만 수행
    hasEnterReadRunRef.current = true;
    console.log("👁️ ENTER READ after messages loaded", {
      roomId: selectedRoomId,
    });
    markRoomAsRead(selectedRoomId);
  }, [selectedRoomId, messages.length, markRoomAsRead]);

  /* ======================
     언마운트 fallback
     - 페이지를 떠날 때 현재 방 기준으로 한 번 더 READ
       (EXIT 훅이 못 탄 경우 대비)
  ====================== */
  useEffect(() => {
    return () => {
      // 🔥 Fast Refresh(HMR)일 때는 fallback 실행 금지
      if (typeof import.meta !== "undefined" && import.meta.hot) return;

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

  /* ⭐ 메시지 실시간 수신 — "구독한 방 ID" 기준으로만 처리
   */
  const handleIncomingMessage = useCallback(
    (msg: any, subscribedRoomId: number) => {
      const parsed = JSON.parse(msg.body) as ChatMessageDto;
      const roomId = subscribedRoomId;

      console.log("💬 RECEIVE MESSAGE", {
        roomId,
        msgId: parsed.id,
      });

      queryClient.setQueryData(
        getQueryKey(queryKeys.chat.messages(roomId)),
        (old: InfiniteData<any> | null) => {
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

      // 읽음 처리용 마지막 메시지 ID 갱신
      lastMessageIdByRoom.current[roomId] = parsed.id;
    },
    [queryClient],
  );

  /* 채팅방 구독 */
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
     알림 구독 (/sub/notifications/{me.id})
     - 여기서는 목록만 갱신 (읽음 처리는 별도)
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

  /* 자동 스크롤 */
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  /* ======================
     UI
  ====================== */
  const selectedRoom = chatRooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left: Room list */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">채팅</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
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
                className={`w-full p-4 border-b hover:bg-gray-50 text-left ${
                  selectedRoomId === room.id ? "bg-gray-100" : ""
                }`}
              >
                <div className="flex items-center gap-3">
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

                    <div className="text-xs text-gray-500 flex gap-2 truncate">
                      <span className="truncate">
                        {room.lastMessage ?? room.post.title}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatLastMessageTime(
                          room.lastMessageTime ?? room.createdAt,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Messages */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-white flex items-center gap-3">
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
              className="flex-1 overflow-y-auto p-4 space-y-4"
              onScroll={(e) => {
                const t = e.currentTarget;

                // 초기 렌더 시 scrollTop === 0 이라서 바로 호출되는 것 방지
                if (t.scrollTop === 0) return;

                // 위로 충분히 스크롤 올렸을 때만 다음 페이지 호출
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

                  {messages.map((msg) => {
                    const isMine = msg.authorId === me?.id;
                    return (
                      <div
                        key={msg.id}
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
                    );
                  })}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
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
      </div>
    </div>
  );
}
