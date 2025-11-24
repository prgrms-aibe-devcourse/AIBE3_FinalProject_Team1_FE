/**
 * 알림 상태 관리 스토어
 * Zustand를 사용한 전역 상태 관리
 */
import { create } from "zustand";

interface NotificationState {
  hasUnread: boolean;
  setHasUnread: (hasUnread: boolean) => void;
}

/**
 * 알림 스토어
 * 읽지 않은 알림 여부를 전역으로 관리
 */
export const useNotificationStore = create<NotificationState>((set) => ({
  hasUnread: false,
  setHasUnread: (hasUnread) => set({ hasUnread }),
}));
