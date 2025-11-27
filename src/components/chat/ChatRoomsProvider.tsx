"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useChatRoomListQuery } from "@/queries/chat";
import { useChatNotificationStomp } from "@/hooks/useChatNotificationStomp";

export function ChatRoomsProvider() {
  const { isAuthenticated } = useAuthStore();
  const { setRooms, clearRooms } = useChatStore();

  const { data, isSuccess } = useChatRoomListQuery(isAuthenticated);

  // 채팅 알림 구독 (채팅 페이지 외에서만 동작)
  useChatNotificationStomp();

  useEffect(() => {
    if (!isAuthenticated) {
      clearRooms();
    }
  }, [isAuthenticated, clearRooms]);

  useEffect(() => {
    if (!isSuccess || !data) return;
    console.log("[ChatRoomsProvider] Setting rooms:", data.length, "rooms");
    setRooms(data);
  }, [isSuccess, data, setRooms]);

  return null;
}

