/**
 * 채팅 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { PaginatedApiResponse } from "@/types/api";
import type {
  ChatMessage,
  ChatRoom,
  CreateChatMessageDto,
} from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  createChatMessage,
  deleteChatMessage,
  deleteChatRoom,
  getChatMessages,
  getChatRoom,
  getChatRoomList,
  getOrCreateChatRoom,
  markChatRoomAsRead,
} from "@/api/endpoints/chat";

/**
 * 채팅방 목록 조회 query
 */
export function useChatRoomListQuery(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.chat.rooms),
    queryFn: async (): Promise<ChatRoom[]> => {
      const response = await getChatRoomList(filters);
      return response;
    },
    staleTime: 1000 * 60 * 1, // 1분간 fresh 상태 유지
  });
}

/**
 * 채팅방 상세 조회 query
 */
export function useChatRoomQuery(roomId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.chat.room(roomId)),
    queryFn: async (): Promise<ChatRoom> => {
      const response = await getChatRoom(roomId);
      return response;
    },
    enabled: !!roomId, // roomId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 1, // 1분간 fresh 상태 유지
  });
}

/**
 * 게시글별 채팅방 조회 또는 생성 query
 */
export function useChatRoomByPostQuery(postId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.chat.byPost(postId)),
    queryFn: async (): Promise<ChatRoom> => {
      const response = await getOrCreateChatRoom(postId);
      return response;
    },
    enabled: !!postId, // postId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
  });
}

/**
 * 채팅 메시지 목록 조회 query
 */
export function useChatMessagesQuery(
  roomId: number,
  filters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.chat.messages(roomId)),
    queryFn: async (): Promise<ChatMessage[] | PaginatedApiResponse<ChatMessage>> => {
      return getChatMessages(roomId, filters);
    },
    enabled: !!roomId, // roomId가 있을 때만 쿼리 실행
    staleTime: 1000 * 30, // 30초간 fresh 상태 유지 (채팅은 자주 업데이트)
    refetchInterval: 1000 * 5, // 5초마다 자동 refetch (실시간 채팅)
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
      // 채팅 메시지 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(
          queryKeys.chat.messages(response.chatRoomId),
        ),
      });
      // 채팅방 목록 쿼리 무효화 (마지막 메시지 업데이트)
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
