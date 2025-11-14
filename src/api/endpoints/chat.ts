/**
 * 채팅 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type {
  ChatMessage,
  ChatRoom,
  CreateChatMessageDto,
} from "@/types/domain";

import { buildQueryParams } from "@/lib/utils/api-params";

import { apiClient } from "@/api/client";

/**
 * 채팅방 목록 조회
 */
export async function getChatRoomList(
  filters?: Record<string, unknown>,
): Promise<ChatRoom[] | PaginatedApiResponse<ChatRoom>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/chats${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<ChatRoom[] | PaginatedApiResponse<ChatRoom>>(endpoint);
}

/**
 * 채팅방 상세 조회
 */
export async function getChatRoom(roomId: number): Promise<ChatRoom> {
  return apiClient.get<ChatRoom>(`/api/v1/chats/${roomId}`);
}

/**
 * 채팅방 생성 또는 조회
 * 응답 형식:
 * - 새 채팅방 생성 시: { id, postId, ... } (ChatRoom 객체)
 * - 이미 존재하는 채팅방: { message: string, chatRoomId: number }
 */
export async function createChatRoom(
  postId: number,
): Promise<{ id: number } | ChatRoom> {
  const response = await apiClient.post<
    ChatRoom | { message: string; chatRoomId: number }
  >("/api/v1/chats", { postId });

  // 이미 존재하는 채팅방인 경우 chatRoomId를 id로 변환
  if ("chatRoomId" in response && "message" in response) {
    return { id: response.chatRoomId };
  }

  // 새로 생성된 채팅방인 경우 ChatRoom 객체 반환
  return response;
}

/**
 * 채팅방 삭제
 */
export async function deleteChatRoom(roomId: number): Promise<void> {
  return apiClient.delete<void>(`/api/v1/chats/${roomId}`);
}

/**
 * 채팅 메시지 목록 조회
 */
export async function getChatMessages(
  roomId: number,
  filters?: Record<string, unknown>,
): Promise<ChatMessage[] | PaginatedApiResponse<ChatMessage>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/chats/${roomId}/messages${params.toString() ? `?${params.toString()}` : ""}`;
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
    `/api/v1/chats/${data.chatRoomId}/messages`,
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
  return apiClient.delete<void>(
    `/api/v1/chats/${roomId}/messages/${messageId}`,
  );
}

/**
 * 채팅방 읽음 처리
 */
export async function markChatRoomAsRead(roomId: number): Promise<void> {
  return apiClient.put<void>(`/api/v1/chats/${roomId}/read`, {});
}
