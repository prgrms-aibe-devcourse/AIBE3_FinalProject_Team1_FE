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

/** 🔥 ChatRoomListRaw — 백엔드 응답을 안전하게 처리하기 위한 raw 타입 */
interface ChatRoomListRaw {
  id?: number;
  createdAt?: string | Date;
  post?: { title?: string };
  title?: string;

  otherMember?: {
    id?: number;
    nickname?: string;
    profileImgUrl?: string | null;
  };
  other_member?: {
    id?: number;
    nickname?: string;
    profileImgUrl?: string | null;
  };

  lastMessage?: string;
  last_message?: string;
  latestMessage?: string;
  latest_message?: string;
  lastMessageText?: string;
  last_message_text?: string;

  lastMessageTime?: string | Date;
  last_message_time?: string | Date;
  latestMessageTime?: string | Date;
  latest_message_time?: string | Date;

  unreadCount?: number;
  unread_count?: number;
  unread?: number;

  messages?: Array<{
    content?: string;
    message?: string;
    body?: string;
    createdAt?: string | Date;
    created_at?: string | Date;
  }>;
}

/**
 * 채팅방 목록 조회
 */
export async function getChatRoomList(): Promise<ChatRoomListDto[]> {
  const response = await apiClient.get<
    PaginatedApiResponse<ChatRoomListDto> | ChatRoomListDto[]
  >("/api/v1/chats");

  if (process.env.NODE_ENV === "development") {
    console.log("[API] getChatRoomList response:", response);
  }

  /* 🔥 any 제거 + 타입 가드 */
  let rawList: unknown[] = [];

  if (Array.isArray(response)) {
    rawList = response;
  } else if (
    typeof response === "object" &&
    response !== null &&
    Array.isArray((response as { content?: unknown }).content)
  ) {
    rawList = (response as { content: unknown[] }).content;
  }

  const mapped: ChatRoomListDto[] = rawList.map((raw) => {
    const item = raw as ChatRoomListRaw; // 🔥 raw 타입 좁히기

    /** -------------------------
     * lastMessage 후보 수집
     * ------------------------- */
    const lastMsgCandidates: unknown[] = [
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

    /** 메시지 배열 fallback */
    if (
      !lastMessage &&
      Array.isArray(item.messages) &&
      item.messages.length > 0
    ) {
      const last = item.messages[item.messages.length - 1];
      lastMessage = last?.content ?? last?.message ?? last?.body ?? null;
    }

    /** -------------------------
     * lastMessageTime 후보 수집
     * ------------------------- */
    const lastTimeCandidates: unknown[] = [
      item.lastMessageTime,
      item.last_message_time,
      item.latestMessageTime,
      item.latest_message_time,
    ];

    let lastMessageTime: Date | null = null;
    for (const t of lastTimeCandidates) {
      if (t) {
        lastMessageTime = new Date(t as string);
        break;
      }
    }

    /** 시간 fallback */
    if (
      !lastMessageTime &&
      Array.isArray(item.messages) &&
      item.messages.length > 0
    ) {
      const last = item.messages[item.messages.length - 1];
      const t = last?.createdAt ?? last?.created_at;
      lastMessageTime = t ? new Date(t as string) : null;
    }

    /** -------------------------
     * otherMember 처리
     * ------------------------- */
    const other = item.otherMember ??
      item.other_member ?? {
        id: 0,
        nickname: "",
        profileImgUrl: null,
      };

    /** -------------------------
     * 최종 조립
     * ------------------------- */
    return {
      id: item.id ?? 0,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      post: {
        title: item.post?.title ?? item.title ?? "",
      },
      otherMember: {
        id: other.id ?? 0,
        nickname: other.nickname ?? "",
        profileImgUrl: other.profileImgUrl ?? null,
      },
      lastMessage,
      lastMessageTime,
      unreadCount: item.unreadCount ?? item.unread_count ?? item.unread ?? 0,
    };
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
 */
export async function createChatRoom(
  postId: number,
): Promise<CreateChatRoomResBody> {
  return apiClient.post<CreateChatRoomResBody>("/api/v1/chats", {
    postId,
  } as CreateChatRoomReqBody);
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
  return apiClient.get<PaginatedApiResponse<ChatMessageDto>>(
    `/api/v1/chats/${roomId}/messages?page=${page}&size=${size}&sort=createdAt,DESC`,
  );
}

/**
 * 채팅 메시지 전송 (HTTP fallback)
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
