/**
 * 채팅 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type {
  ChatMessageDto,
  ChatRoomDto,
  ChatRoomListDto,
  CreateChatRoomReqBody,
  CreateChatRoomResBody,
  SendChatMessageDto,
} from "@/types/domain";

import { apiClient } from "@/api/client";

/**
 * 채팅방 목록 조회
 */
export async function getChatRoomList(): Promise<ChatRoomListDto[]> {
  const response = await apiClient.get<
    PaginatedApiResponse<ChatRoomListDto> | ChatRoomListDto[]
  >("/api/v1/chats");

  // 개발 중에는 응답 형태를 로그로 확인
  if (process.env.NODE_ENV === "development") {
    console.log("[API] getChatRoomList response:", response);
  }

  // 서버가 페이징 형태로 반환하는 경우(content)와 단순 배열을 반환하는 경우 둘 다 처리
  let rawList: any[] = [];
  if (Array.isArray(response)) {
    rawList = response as any[];
  } else if (
    (response as any)?.content &&
    Array.isArray((response as any).content)
  ) {
    rawList = (response as any).content as any[];
  }

  // 안전하게 필드 매핑: 여러 케이스(스네이크 케이스, 배열 내 메시지 등)를 처리
  const mapped: ChatRoomListDto[] = rawList.map((item) => {
    const lastMsgCandidates = [
      item.lastMessage,
      item.last_message,
      item.latestMessage,
      item.latest_message,
      item.lastMessageText,
      item.last_message_text,
    ];

    let lastMessage: string | null = null;
    for (const c of lastMsgCandidates) {
      if (typeof c === "string" && c.trim().length > 0) {
        lastMessage = c;
        break;
      }
    }

    // messages 배열이 있으면 마지막 요소 내용을 우선으로 사용
    if (
      !lastMessage &&
      Array.isArray(item.messages) &&
      item.messages.length > 0
    ) {
      const last = item.messages[item.messages.length - 1];
      lastMessage = last?.content ?? last?.message ?? last?.body ?? null;
    }

    // lastMessageTime 후보들
    const lastTimeCandidates = [
      item.lastMessageTime,
      item.last_message_time,
      item.latestMessageTime,
      item.latest_message_time,
    ];
    let lastMessageTime: string | null = null;
    for (const t of lastTimeCandidates) {
      if (t) {
        lastMessageTime = t;
        break;
      }
    }

    // 메시지 배열에서 시간 추출 우선순위
    if (
      !lastMessageTime &&
      Array.isArray(item.messages) &&
      item.messages.length > 0
    ) {
      const last = item.messages[item.messages.length - 1];
      lastMessageTime = last?.createdAt ?? last?.created_at ?? null;
    }

    const unreadCount =
      item.unreadCount ?? item.unread_count ?? item.unread ?? 0;

    return {
      id: item.id,
      createdAt: item.createdAt,
      post: item.post ?? { title: item.title ?? "" },
      otherMember: item.otherMember ??
        item.other_member ?? {
          id: item.otherMember?.id ?? 0,
          nickname: item.otherMember?.nickname ?? "",
          profileImgUrl: item.otherMember?.profileImgUrl ?? null,
        },
      lastMessage,
      lastMessageTime,
      unreadCount,
    } as ChatRoomListDto;
  });

  return mapped;
}

/**
 * 채팅방 상세 조회
 */
export async function getChatRoom(roomId: number): Promise<ChatRoomDto> {
  return apiClient.get<ChatRoomDto>(`/api/v1/chats/${roomId}`);
}

/**
 * 채팅방 생성 또는 조회
 * 응답: { message: string, chatRoomId: number }
 */
export async function createChatRoom(
  postId: number,
): Promise<CreateChatRoomResBody> {
  const response = await apiClient.post<CreateChatRoomResBody>(
    "/api/v1/chats",
    { postId } as CreateChatRoomReqBody,
  );
  return response;
}

/**
 * 채팅방 삭제
 */
export async function deleteChatRoom(roomId: number): Promise<void> {
  return apiClient.delete<void>(`/api/v1/chats/${roomId}`);
}

/**
 * 채팅 메시지 목록 조회 (페이지네이션)
 */
export async function getChatMessages(
  roomId: number,
  page: number = 0,
  size: number = 20,
): Promise<PaginatedApiResponse<ChatMessageDto>> {
  return await apiClient.get<PaginatedApiResponse<ChatMessageDto>>(
    `/api/v1/chats/${roomId}/messages?page=${page}&size=${size}&sort=createdAt,DESC`,
  );
}

/**
 * 채팅 메시지 전송
 */
export async function sendChatMessage(
  roomId: number,
  data: SendChatMessageDto,
): Promise<ChatMessageDto> {
  return apiClient.post<ChatMessageDto>(
    `/api/v1/chats/${roomId}/messages`,
    data,
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
export async function markChatRoomAsRead(
  roomId: number,
  lastMessageId: number,
): Promise<void> {
  console.log(
    `[API] Marking room ${roomId} as read up to message ${lastMessageId}`,
  );

  const result = await apiClient.patch<void>(
    `/api/v1/chats/${roomId}/read?lastMessageId=${lastMessageId}`,
    {},
  );

  console.log(`[API] Successfully marked room ${roomId} as read`);
  return result;
}
