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
  ChatMessageDto,
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
 * 채팅방 목록 조회 query
 */
export function useChatRoomListQuery() {
  return useQuery({
    queryKey: getQueryKey(queryKeys.chat.rooms),
    queryFn: async (): Promise<ChatRoomListDto[]> => {
      try {
        const response = await getChatRoomList();
        if (process.env.NODE_ENV === "development") {
          console.log("[Query] chat rooms fetched:", response);
        }
        return response;
      } catch (error) {
        console.error("Failed to fetch chat room list:", error);
        return [];
      }
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30, // 30분간 메모리에 유지
    refetchOnWindowFocus: false, // 창 포커스 시 refetch 안함
    refetchOnReconnect: false, // 재연결 시 refetch 안함
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
    queryFn: async ({
      pageParam = 0,
    }): Promise<PaginatedApiResponse<ChatMessageDto>> => {
      try {
        return await getChatMessages(roomId!, pageParam, 20);
      } catch (error) {
        console.error("Failed to fetch chat messages:", error);
        return {
          content: [],
          page: {
            page: pageParam,
            size: 0,
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
    getNextPageParam: (lastPage) =>
      lastPage.page.hasNext ? lastPage.page.page + 1 : undefined,
    initialPageParam: 0,
    enabled: !!roomId && roomId > 0,
    staleTime: Infinity, // 최초 1회만 로드, 그 후는 실시간 업데이트만
    gcTime: 1000 * 60 * 30, // 30분간 메모리에 유지
    refetchOnWindowFocus: false, // 창 포커스 시 refetch 안함
    refetchOnReconnect: false, // 재연결 시 refetch 안함
    retry: false,
  });
}

/**
 * 채팅 메시지 전송 mutation
 */
export function useSendChatMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, content }: { roomId: number; content: string }) =>
      sendChatMessage(roomId, { content } as SendChatMessageDto),
    onSuccess: (_, variables) => {
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
 * ⭐ 채팅방 읽음 처리 mutation (개선된 버전)
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
      console.log(
        "[markChatRoomAsRead API call] roomId:",
        roomId,
        "lastMessageId:",
        lastMessageId,
      );
      return markChatRoomAsRead(roomId, lastMessageId);
    },
    onSuccess: (_, variables) => {
      console.log("[Mark as read SUCCESS] roomId:", variables.roomId);
      // 채팅방 목록을 무효화하여 unreadCount 업데이트
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.rooms),
      });
    },
    onError: (error) => {
      console.error("Mark as read error:", error);
    },
  });
}

// 간단한 채팅방 목록 쿼리 (기존 호환)
export function useChatRoomsQuery() {
  return useChatRoomListQuery();
}
