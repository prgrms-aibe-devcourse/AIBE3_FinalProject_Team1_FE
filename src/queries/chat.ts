// src/queries/chat.ts
/**
 * 채팅 관련 React Query 쿼리
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { PaginatedApiResponse } from "@/types/api";
import type {
  ChatRoomDto,
  ChatRoomListDto,
  SendChatMessageDto,
} from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  createChatRoom,
  deleteChatMessage,
  deleteChatRoom,
  getChatMessages,
  getChatRoom,
  getChatRoomList,
  markChatRoomAsRead,
  sendChatMessage,
} from "@/api/endpoints/chat";

/**
 * 채팅방 목록 조회 query (무한 스크롤)
 */
export function useChatRoomListQuery(enabled = true) {
  const size = 5;
  
  return useInfiniteQuery({
    queryKey: [
      ...getQueryKey(queryKeys.chat.rooms),
      { size },
    ],
    queryFn: async ({ pageParam = 0 }): Promise<PaginatedApiResponse<ChatRoomListDto>> => {
      try {
        const response = await getChatRoomList(pageParam, size);
        return response;
      } catch (error) {
        console.error("Failed to fetch chat room list:", error);
        return {
          content: [],
          page: {
            page: 0,
            size: 5,
            totalElements: 0,
            totalPages: 0,
            first: true,
            last: true,
            hasNext: false,
            hasPrevious: false,
            sort: [],
          },
        };
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.page.hasNext ? lastPage.page.page + 1 : undefined;
    },
    enabled,
    // ChatPage 들어올 때마다 invalidateQueries로 1번 새로 가져오고
    // 그 이후에는 staleTime 무한 + refetch X 로 유지
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

/**
 * 채팅방 상세 조회 query
 */
export function useChatRoomQuery(roomId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.chat.room(roomId)),
    queryFn: async (): Promise<ChatRoomDto | null> => {
      try {
        return await getChatRoom(roomId);
      } catch (error) {
        console.error("Failed to fetch chat room:", error);
        return null;
      }
    },
    enabled: !!roomId,
    staleTime: 1000 * 60 * 1,
    retry: false,
  });
}

/**
 * 채팅방 생성 mutation
 */
export function useCreateChatRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => createChatRoom(postId),
    onSuccess: () => {
      // 새 채팅방 생겼으니 목록은 다시 불러오기
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.rooms),
      });
    },
    onError: (error) => {
      console.error("Create chat room error:", error);
    },
  });
}

/**
 * 채팅 메시지 목록 조회 (무한 스크롤)
 */
export function useChatMessagesQuery(roomId: number | null) {
  return useInfiniteQuery({
    queryKey: getQueryKey(queryKeys.chat.messages(roomId || 0)),

    // ⭐ 초기엔 page=0만 호출됨
    queryFn: async ({ pageParam = 0 }) => {
      return await getChatMessages(roomId!, pageParam, 20);
    },

    // ⭐ 초기 page
    initialPageParam: 0,

    // ⭐ "서버 absolute page 번호" 기반으로 다음 페이지 계산
    //    → pages.length 기반으로 계산하면 절대 안 됨 (자동 prefetch 발생)
    getNextPageParam: (lastPage) => {
      return lastPage.page.hasNext ? lastPage.page.page + 1 : undefined;
    },

    enabled: !!roomId, // roomId 있을 때만 작동

    // ⭐ 핵심: prefetch 방지!!
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * 채팅 메시지 전송 mutation
 * (웹소켓 publish 실패 시 HTTP fallback 용)
 */
export function useSendChatMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, content }: { roomId: number; content: string }) =>
      sendChatMessage(roomId, { content } as SendChatMessageDto),
    onSuccess: (_, variables) => {
      // HTTP 전송일 때만 messages refetch
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.messages(variables.roomId)),
      });
    },
    onError: (error) => {
      console.error("Send chat message error:", error);
    },
  });
}

/**
 * 채팅 메시지 삭제 mutation
 */
export function useDeleteChatMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { roomId: number; messageId: number }) =>
      deleteChatMessage(variables.roomId, variables.messageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.messages(variables.roomId)),
      });
    },
    onError: (error) => {
      console.error("Delete chat message error:", error);
    },
  });
}

/**
 * 채팅방 삭제 mutation
 */
export function useDeleteChatRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: number) => deleteChatRoom(roomId),
    onSuccess: (_, roomId) => {
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.chat.room(roomId)),
      });
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.chat.messages(roomId)),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.rooms),
      });
    },
    onError: (error) => {
      console.error("Delete chat room error:", error);
    },
  });
}

/**
 * 채팅방 읽음 처리 mutation
 * ✅ 읽음 처리 후 채팅방 목록을 다시 불러와서 최신 unreadCount 반영
 */
export function useMarkAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roomId,
      lastMessageId,
    }: {
      roomId: number;
      lastMessageId: number;
    }) => {
      return markChatRoomAsRead(roomId, lastMessageId);
    },
    onSuccess: () => {
      // 읽음 처리 성공 후 채팅방 목록 갱신
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.rooms),
      });
    },
    onError: (error) => {
      console.error("Mark as read error:", error);
    },
  });
}

// 기존 이름 유지용 alias
export function useChatRoomsQuery() {
  return useChatRoomListQuery();
}
