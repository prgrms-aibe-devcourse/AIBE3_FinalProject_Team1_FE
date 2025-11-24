"use client";

/**
 * SSE 알림 연결 Provider
 *
 * 사이트 전체에서 알림 SSE 연결을 유지하는 컴포넌트
 * 레이아웃에 포함하여 사용
 *
 * - SSE 연결 초기화
 * - 초기 로딩 시 읽지 않은 알림 여부 API 호출하여 전역 상태 업데이트
 */
import { useNotificationSSE } from "@/hooks/useNotificationSSE";
import { useHasUnreadNotificationsQuery } from "@/queries/notification";
import { useAuthStore } from "@/store/authStore";

export function NotificationSSEProvider() {
  const { isAuthenticated } = useAuthStore();

  // SSE 연결을 초기화 (전역으로 유지됨)
  useNotificationSSE();

  // 초기 로딩 시 읽지 않은 알림 여부 조회 (로그인한 경우에만)
  useHasUnreadNotificationsQuery({
    enabled: isAuthenticated,
  });

  // UI를 렌더링하지 않음
  return null;
}

