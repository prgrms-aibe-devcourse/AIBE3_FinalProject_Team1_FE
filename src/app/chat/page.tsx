/**
 * 채팅 페이지
 * 좌측에 채팅방 목록, 우측에 선택된 채팅방의 메시지
 */
"use client";

import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Suspense, useEffect, useRef, useState } from "react";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import type { ChatMessage, ChatRoom } from "@/types/domain";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  useChatMessagesQuery,
  useChatRoomListQuery,
  useChatRoomQuery,
  useCreateChatMessageMutation,
} from "@/queries/chat";
import { useMeQuery } from "@/queries/user";
import { useStomp } from "@/hooks/useStomp";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { getQueryKey, queryKeys } from "@/lib/query-keys";
import type { PaginatedApiResponse } from "@/types/api";

import { MessageSquare, Send, User } from "lucide-react";

/**
 * 채팅 페이지
 * 좌측에 채팅방 목록, 우측에 선택된 채팅방의 메시지
 */

/**
 * 채팅 페이지
 * 좌측에 채팅방 목록, 우측에 선택된 채팅방의 메시지
 */

/**
 * 타임스탬프 포맷팅
 */
function formatTimestamp(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    // 오늘인 경우 시간만 표시
    return format(dateObj, "a h:mm", { locale: ko });
  } else if (days === 1) {
    // 어제
    return "어제";
  } else if (days < 7) {
    // 7일 이내
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
  } else {
    // 7일 이상
    return format(dateObj, "yyyy. MM. dd.", { locale: ko });
  }
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get("roomId");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    roomIdParam ? Number(roomIdParam) : null,
  );
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: me } = useMeQuery();
  const {
    data: chatRoomsData,
    isLoading: roomsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatRoomListQuery();
  // 선택된 채팅방 상세 정보 조회 (목록과 별개)
  // 채팅방 상세 정보는 필요 시 사용할 수 있도록 쿼리만 실행
  useChatRoomQuery(selectedRoomId || 0);
  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage: fetchNextMessages,
    hasNextPage: hasNextMessages,
    isFetchingNextPage: isFetchingNextMessages,
  } = useChatMessagesQuery(selectedRoomId || 0, {});
  const createMessageMutation = useCreateChatMessageMutation();
  // const markAsReadMutation = useMarkChatRoomAsReadMutation();

  // STOMP 연결
  const { isConnected, subscribe, publish } = useStomp();
  const queryClient = useQueryClient();

  // 무한 스크롤: 모든 페이지의 채팅방을 하나의 배열로 합치기
  const chatRooms = chatRoomsData?.pages.flatMap((page) => page.content) || [];

  // 무한 스크롤: 모든 페이지의 메시지를 하나의 배열로 합치기 (최신 메시지가 아래에 오도록 역순으로 합치기)
  const messages =
    messagesData?.pages
      .flatMap((page) => page.content)
      .sort((a, b) => {
        // 생성 시간 기준으로 정렬 (오래된 메시지가 위에, 최신 메시지가 아래에)
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return aTime - bTime;
      }) || [];

  // 채팅방 선택 시 URL 업데이트
  useEffect(() => {
    if (selectedRoomId) {
      router.replace(`/chat?roomId=${selectedRoomId}`, { scroll: false });
      // 읽음 처리 비활성화
      // markAsReadMutation.mutate(selectedRoomId);
    }
  }, [selectedRoomId, router]);

  // 새 메시지가 추가되면 스크롤을 맨 아래로 (최신 메시지가 아래에 있음)
  useEffect(() => {
    // 첫 로드이거나 새 메시지가 추가된 경우에만 스크롤
    if (!messagesLoading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, messagesLoading]);

  // URL 파라미터로 채팅방 선택
  useEffect(() => {
    if (roomIdParam) {
      setSelectedRoomId(Number(roomIdParam));
    }
  }, [roomIdParam]);

  // STOMP: 선택된 채팅방 메시지 구독
  useEffect(() => {
    if (!isConnected || !selectedRoomId) return;

    // `/sub/chat/room/{roomId}` 구독
    const unsubscribe = subscribe(
      `/sub/chat/room/${selectedRoomId}`,
      (stompMessage) => {
        try {
          const newMessage: ChatMessage = JSON.parse(stompMessage.body);

          // React Query 캐시 업데이트 (무한 스크롤 쿼리)
          queryClient.setQueryData<
            InfiniteData<PaginatedApiResponse<ChatMessage>>
          >(
            getQueryKey(queryKeys.chat.messages(selectedRoomId)),
            (oldData) => {
              if (!oldData) return oldData;

              // 이미 존재하는 메시지인지 확인 (중복 방지)
              const existingMessage = oldData.pages
                .flatMap((page) => page.content)
                .find((msg) => msg.id === newMessage.id);

              if (existingMessage) {
                return oldData;
              }

              // 첫 번째 페이지에 새 메시지 추가
              const firstPage = oldData.pages[0];
              if (firstPage) {
                return {
                  ...oldData,
                  pages: [
                    {
                      ...firstPage,
                      content: [...firstPage.content, newMessage],
                      page: {
                        ...firstPage.page,
                        totalElements: firstPage.page.totalElements + 1,
                      },
                    },
                    ...oldData.pages.slice(1),
                  ],
                };
              }

              return oldData;
            },
          );

          // 채팅방 목록 쿼리 무효화 (마지막 메시지 업데이트)
          queryClient.invalidateQueries({
            queryKey: getQueryKey(queryKeys.chat.rooms),
          });

          // 새 메시지가 추가되면 스크롤을 맨 아래로
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } catch (error) {
          console.error("Failed to parse STOMP message:", error);
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [isConnected, selectedRoomId, subscribe, queryClient]);

  // 메시지 전송 (STOMP 사용)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !message.trim()) return;

    if (isConnected) {
      // STOMP로 메시지 발행
      try {
        publish(`/pub/chat/message`, {
          chatRoomId: selectedRoomId,
          content: message.trim(),
        });
        setMessage("");
        // 메시지 전송 후 스크롤을 맨 아래로
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (error) {
        console.error("Send message via STOMP failed:", error);
        // STOMP 실패 시 REST API로 폴백
        try {
          await createMessageMutation.mutateAsync({
            chatRoomId: selectedRoomId,
            content: message.trim(),
          });
          setMessage("");
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } catch (restError) {
          console.error("Send message via REST API failed:", restError);
        }
      }
    } else {
      // STOMP 연결이 안 되어 있으면 REST API 사용
      try {
        await createMessageMutation.mutateAsync({
          chatRoomId: selectedRoomId,
          content: message.trim(),
        });
        setMessage("");
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (error) {
        console.error("Send message failed:", error);
      }
    }
  };

  // 선택된 채팅방 정보
  const selectedRoom = chatRooms?.find((room) => room.id === selectedRoomId);

  // 채팅방의 상대방 정보 가져오기
  const getOtherMember = (room: ChatRoom) => {
    if (!room.members || !me) return null;
    return room.members.find((member) => member.memberId !== me.id)?.member;
  };

  // 선택된 채팅방의 상대방 정보
  const otherMember = selectedRoom ? getOtherMember(selectedRoom) : null;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 좌측 사이드바 - 채팅방 목록 */}
      <aside className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">채팅</h2>
        </div>
        <div
          className="flex-1 overflow-y-auto"
          onScroll={(e) => {
            const target = e.currentTarget;
            // hasNextPage가 없으면 요청하지 않음
            if (!hasNextPage || isFetchingNextPage) {
              return;
            }
            // 스크롤이 하단에 가까워지면 다음 페이지 로드 (100px 여유)
            const scrollBottom =
              target.scrollHeight - target.scrollTop - target.clientHeight;
            if (scrollBottom <= 100) {
              fetchNextPage();
            }
          }}
        >
          {roomsLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : chatRooms && chatRooms.length > 0 ? (
            <>
              <div className="divide-y divide-gray-100">
                {chatRooms.map((room) => {
                  const other = getOtherMember(room);
                  const lastMessage = room.lastMessage;
                  const unreadCount = room.unreadCount || 0;

                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedRoomId === room.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* 프로필 이미지 */}
                        <div className="relative flex-shrink-0">
                          <div className="relative h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {other?.profileImgUrl ? (
                              <Image
                                src={other.profileImgUrl}
                                alt={other.nickname || "User"}
                                fill
                                className="object-cover rounded-full"
                                sizes="48px"
                              />
                            ) : (
                              <User className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          {/* 읽지 않은 메시지 수 배지 */}
                          {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </div>
                          )}
                        </div>

                        {/* 채팅방 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {other?.nickname || "알 수 없음"}
                            </p>
                            {lastMessage && (
                              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                {formatTimestamp(lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          {room.post && (
                            <p className="text-xs text-gray-500 truncate mb-1">
                              {room.post.title}
                            </p>
                          )}
                          {lastMessage && (
                            <p className="text-sm text-gray-600 truncate">
                              {lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* 로딩 중 표시 */}
              {isFetchingNextPage && (
                <div className="p-4 space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={`loading-${i}`} className="animate-pulse">
                      <div className="flex gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-200" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2" />
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full p-4">
              <p className="text-sm text-gray-500 text-center">
                채팅방이 없습니다.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* 우측 메인 영역 - 메시지 */}
      <main className="flex-1 flex flex-col bg-gray-50">
        {selectedRoomId && selectedRoom ? (
          <>
            {/* 채팅방 헤더 */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {otherMember?.profileImgUrl ? (
                    <Image
                      src={otherMember.profileImgUrl}
                      alt={otherMember.nickname || "User"}
                      fill
                      className="object-cover rounded-full"
                      sizes="40px"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {otherMember?.nickname || "알 수 없음"}
                  </p>
                  {selectedRoom.post && (
                    <p className="text-xs text-gray-500">
                      {selectedRoom.post.title}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 메시지 목록 */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              onScroll={(e) => {
                const target = e.currentTarget;
                // 스크롤이 상단에 가까워지면 이전 메시지 로드 (메시지는 위로 스크롤하면 이전 메시지)
                if (!hasNextMessages || isFetchingNextMessages) {
                  return;
                }
                // 스크롤이 상단에서 100px 이내이면 이전 페이지 로드
                if (target.scrollTop <= 100) {
                  fetchNextMessages();
                }
              }}
            >
              {messagesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2 w-1/4" />
                          <div className="h-12 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length > 0 ? (
                <>
                  {/* 이전 메시지 로딩 중 표시 */}
                  {isFetchingNextMessages && (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={`loading-${i}`} className="animate-pulse">
                          <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200" />
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded mb-2 w-1/4" />
                              <div className="h-12 bg-gray-200 rounded" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {messages.map((msg: ChatMessage) => {
                    const isMyMessage = msg.chatMember?.memberId === me?.id;
                    const sender = msg.chatMember?.member;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${
                          isMyMessage ? "flex-row-reverse" : ""
                        }`}
                      >
                        {/* 프로필 이미지 */}
                        {!isMyMessage && (
                          <div className="relative h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {sender?.profileImgUrl ? (
                              <Image
                                src={sender.profileImgUrl}
                                alt={sender.nickname || "User"}
                                fill
                                className="object-cover rounded-full"
                                sizes="32px"
                              />
                            ) : (
                              <User className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        )}

                        {/* 메시지 내용 */}
                        <div
                          className={`flex flex-col max-w-[70%] ${
                            isMyMessage ? "items-end" : "items-start"
                          }`}
                        >
                          {!isMyMessage && (
                            <p className="text-xs text-gray-500 mb-1">
                              {sender?.nickname || "알 수 없음"}
                            </p>
                          )}
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isMyMessage
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-900"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {formatTimestamp(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">메시지가 없습니다.</p>
                </div>
              )}
            </div>

            {/* 메시지 입력 */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  disabled={createMessageMutation.isPending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!message.trim() || createMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">채팅방을 선택해주세요</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
