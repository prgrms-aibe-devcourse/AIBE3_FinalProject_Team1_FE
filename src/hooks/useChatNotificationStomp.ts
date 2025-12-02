"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import type {
  ChatNotiDto,
  NewMessageNotiDto,
  NewRoomNotiDto,
} from "@/types/domain";
import { useStomp } from "@/hooks/useStomp";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { getQueryKey, queryKeys } from "@/lib/query-keys";

export function useChatNotificationStomp() {
  const pathname = usePathname();
  const { isConnected, subscribe } = useStomp();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const addRoom = useChatStore((state) => state.addRoom);
  const updateRoom = useChatStore((state) => state.updateRoom);

  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const destination = `/sub/notifications/${user.id}`;

    const unsubscribe = subscribe(destination, (msg) => {
      try {
        const noti = JSON.parse(msg.body) as ChatNotiDto;

        if (noti.type === "NEW_ROOM") {
          // Zustand에 낙관적 업데이트
          addRoom(noti.payload as NewRoomNotiDto);
          // React Query 캐시 무효화하여 서버에서 최신 데이터 가져오기
          queryClient.invalidateQueries({
            queryKey: getQueryKey(queryKeys.chat.rooms),
          });
        } else if (noti.type === "NEW_MESSAGE") {
          const payload = noti.payload as NewMessageNotiDto;

          // 현재 보고 있는 방이 아니면 unreadCount 증가
          const currentRoomId = useChatStore.getState().currentRoomId;
          const isCurrentRoom = currentRoomId === payload.chatRoomId;
          
          updateRoom(payload.chatRoomId, (room) => {
            const newUnread = isCurrentRoom ? (room.unreadCount ?? 0) : (room.unreadCount ?? 0) + 1;
            return {
              ...room,
              lastMessage: payload.content,
              lastMessageTime: payload.createdAt,
              unreadCount: newUnread,
            };
          });
        }
      } catch (error) {
        console.error("[CHAT-NOTI] parse error", error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, user?.id, pathname, subscribe, addRoom, updateRoom, queryClient]);
}

