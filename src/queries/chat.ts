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
  ChatMessage,
  ChatRoom,
  CreateChatMessageDto,
} from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  createChatMessage,
  createChatRoom,
  deleteChatMessage,
  deleteChatRoom,
  getChatMessages,
  getChatRoom,
  getChatRoomList,
  markChatRoomAsRead,
} from "@/api/endpoints/chat";

/**
 * 채팅방 목록 조회 query (무한 스크롤)
 */
export function useChatRoomListQuery(filters?: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: getQueryKey(queryKeys.chat.rooms),
    queryFn: async ({
      pageParam = 0,
    }): Promise<PaginatedApiResponse<ChatRoom>> => {
      try {
        // pageable 객체를 펼쳐서 전달 (buildQueryParams가 page, size, sort를 직접 처리)
        const response = await getChatRoomList({
          ...filters,
          page: pageParam,
          size: 20,
          sort: ["createdAt,DESC"],
        });

        // 배열이면 페이지네이션 응답으로 변환
        if (Array.isArray(response)) {
          return {
            content: response,
            page: {
              page: 0,
              size: response.length,
              totalElements: response.length,
              totalPages: 1,
              first: true,
              last: true,
              hasNext: false,
              hasPrevious: false,
              sort: [],
            },
          };
        }

        // 이미 페이지네이션 응답인 경우
        return response;
      } catch (error) {
        // API 실패 시 빈 페이지네이션 응답 반환
        console.error("Failed to fetch chat room list:", error);
        return {
          content: [],
          page: {
            page: pageParam,
            size: 20,
            totalElements: 0,
            totalPages: 0,
            first: pageParam === 0,
            last: true,
            hasNext: false,
            hasPrevious: pageParam > 0,
            sort: [],
          },
        };
      }
    },
    getNextPageParam: (lastPage) => {
      // hasNext가 false이면 더 이상 페이지가 없음
      if (!lastPage.page.hasNext) {
        return undefined;
      }
      // 다음 페이지 번호 반환
      return lastPage.page.page + 1;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 1, // 1분간 fresh 상태 유지
    refetchInterval: 1000 * 10, // 10초마다 자동 refetch (실시간 채팅)
    retry: false,
  });
}

/**
 * 채팅방 상세 조회 query
 */
export function useChatRoomQuery(roomId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.chat.room(roomId)),
    queryFn: async (): Promise<ChatRoom | null> => {
      try {
        const response = await getChatRoom(roomId);
        return response;
      } catch (error) {
        // API 실패 시 null 반환하여 정상 동작
        console.error("Failed to fetch chat room:", error);
        return null;
      }
    },
    enabled: !!roomId, // roomId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 1, // 1분간 fresh 상태 유지
    retry: false,
  });
}

/**
 * 게시글별 채팅방 생성 mutation
 */
export function useCreateChatRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => createChatRoom(postId),
    onSuccess: (result) => {
      // 채팅방 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.rooms),
      });
      // 생성된/조회된 채팅방 상세 쿼리도 무효화
      // result는 { id: number } 또는 ChatRoom 객체이므로 항상 id 속성 있음
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.room(result.id)),
      });
    },
    onError: (error) => {
      console.error("Create chat room error:", error);
    },
  });
}

/**
 * 채팅 메시지 목록 조회 query (무한 스크롤)
 */
export function useChatMessagesQuery(
  roomId: number,
  filters?: Record<string, unknown>,
) {
  return useInfiniteQuery({
    queryKey: getQueryKey(queryKeys.chat.messages(roomId)),
    queryFn: async ({
      pageParam = 0,
    }): Promise<PaginatedApiResponse<ChatMessage>> => {
      try {
        // pageable 객체를 펼쳐서 전달 (buildQueryParams가 page, size, sort를 직접 처리)
        const response = await getChatMessages(roomId, {
          ...filters,
          page: pageParam,
          size: 20,
          sort: ["createdAt,DESC"], // 최신 메시지가 먼저 오도록 내림차순
        });

        // 배열이면 페이지네이션 응답으로 변환
        if (Array.isArray(response)) {
          return {
            content: response,
            page: {
              page: 0,
              size: response.length,
              totalElements: response.length,
              totalPages: 1,
              first: true,
              last: true,
              hasNext: false,
              hasPrevious: false,
              sort: [],
            },
          };
        }

        // 이미 페이지네이션 응답인 경우
        return response;
      } catch (error) {
        // API 실패 시 빈 페이지네이션 응답 반환
        console.error("Failed to fetch chat messages:", error);
        return {
          content: [],
          page: {
            page: pageParam,
            size: 20,
            totalElements: 0,
            totalPages: 0,
            first: pageParam === 0,
            last: true,
            hasNext: false,
            hasPrevious: pageParam > 0,
            sort: [],
          },
        };
      }
    },
    getNextPageParam: (lastPage) => {
      // hasNext가 false이면 더 이상 페이지가 없음
      if (!lastPage.page.hasNext) {
        return undefined;
      }
      // 다음 페이지 번호 반환
      return lastPage.page.page + 1;
    },
    initialPageParam: 0,
    enabled: !!roomId && roomId > 0, // roomId가 있을 때만 쿼리 실행
    staleTime: 1000 * 30, // 30초간 fresh 상태 유지 (채팅은 자주 업데이트)
    retry: false,
  });
}

/**
 * 채팅 메시지 생성 mutation
 */
export function useCreateChatMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChatMessageDto) => createChatMessage(data),
    onSuccess: (response) => {
      // 채팅 메시지 목록 쿼리 무효화 (무한 스크롤 쿼리)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.messages(response.chatRoomId)),
      });
      // 채팅방 목록 쿼리 무효화 (마지막 메시지 업데이트, 무한 스크롤 쿼리)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.rooms),
      });
      // 채팅방 상세 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.room(response.chatRoomId)),
      });
    },
    onError: (error) => {
      console.error("Create chat message error:", error);
    },
  });
}

/**
 * 채팅 메시지 삭제 mutation
 */
export function useDeleteChatMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roomId,
      messageId,
    }: {
      roomId: number;
      messageId: number;
    }) => deleteChatMessage(roomId, messageId),
    onSuccess: (_, variables) => {
      // 채팅 메시지 목록 쿼리 무효화
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
      // 채팅방 상세 쿼리 제거
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.chat.room(roomId)),
      });
      // 채팅 메시지 목록 쿼리 제거
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.chat.messages(roomId)),
      });
      // 채팅방 목록 쿼리 무효화
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
 */
export function useMarkChatRoomAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: number) => markChatRoomAsRead(roomId),
    onSuccess: (_, roomId) => {
      // 채팅방 상세 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.room(roomId)),
      });
      // 채팅방 목록 쿼리 무효화 (읽지 않은 메시지 수 업데이트)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.chat.rooms),
      });
    },
    onError: (error) => {
      console.error("Mark chat room as read error:", error);
    },
  });
}
