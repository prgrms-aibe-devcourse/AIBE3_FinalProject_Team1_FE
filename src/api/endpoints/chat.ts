/**
 * 채팅 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type {
  ChatMessage,
  ChatRoom,
  CreateChatMessageDto,
} from "@/types/domain";

import { apiClient } from "@/api/client";

/**
 * 채팅방 목록 조회
 */
export async function getChatRoomList(
  filters?: Record<string, unknown>,
): Promise<ChatRoom[]> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  const endpoint = `/api/v1/chat/rooms${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<ChatRoom[]>(endpoint);
}

/**
 * 채팅방 상세 조회
 */
export async function getChatRoom(roomId: number): Promise<ChatRoom> {
  return apiClient.get<ChatRoom>(`/api/v1/chat/rooms/${roomId}`);
}

/**
 * 게시글별 채팅방 조회 또는 생성
 */
export async function getOrCreateChatRoom(postId: number): Promise<ChatRoom> {
  return apiClient.post<ChatRoom>(`/api/v1/posts/${postId}/chat/rooms`, {});
}

/**
 * 채팅방 삭제
 */
export async function deleteChatRoom(roomId: number): Promise<void> {
  return apiClient.delete<void>(`/api/v1/chat/rooms/${roomId}`);
}

/**
 * 채팅 메시지 목록 조회
 */
export async function getChatMessages(
  roomId: number,
  filters?: Record<string, unknown>,
): Promise<ChatMessage[] | PaginatedApiResponse<ChatMessage>> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  const endpoint = `/api/v1/chat/rooms/${roomId}/messages${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<ChatMessage[] | PaginatedApiResponse<ChatMessage>>(
    endpoint,
  );
}

/**
 * 채팅 메시지 생성
 */
export async function createChatMessage(
  data: CreateChatMessageDto,
): Promise<ChatMessage> {
  return apiClient.post<ChatMessage>(
    `/api/v1/chat/rooms/${data.chatRoomId}/messages`,
    { content: data.content },
  );
}

/**
 * 채팅 메시지 삭제
 */
export async function deleteChatMessage(
  roomId: number,
  messageId: number,
): Promise<void> {
  return apiClient.delete<void>(`/api/v1/chat/rooms/${roomId}/messages/${messageId}`);
}

/**
 * 채팅방 읽음 처리
 */
export async function markChatRoomAsRead(roomId: number): Promise<void> {
  return apiClient.put<void>(`/api/v1/chat/rooms/${roomId}/read`, {});
}
