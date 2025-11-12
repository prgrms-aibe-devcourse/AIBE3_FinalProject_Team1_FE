/**
 * 알림 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type { Notification } from "@/types/domain";

import { apiClient } from "@/api/client";

/**
 * 알림 목록 조회
 */
export async function getNotificationList(
  filters?: Record<string, unknown>,
): Promise<PaginatedApiResponse<Notification>> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  const endpoint = `/api/v1/notifications${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Notification>>(endpoint);
}

/**
 * 읽지 않은 알림 목록 조회
 */
export async function getUnreadNotifications(
  filters?: Record<string, unknown>,
): Promise<PaginatedApiResponse<Notification>> {
  const params = new URLSearchParams();
  params.append("isRead", "false");
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  const endpoint = `/api/v1/notifications${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Notification>>(endpoint);
}

/**
 * 알림 상세 조회
 */
export async function getNotification(
  notificationId: number,
): Promise<Notification> {
  return apiClient.get<Notification>(`/api/v1/notifications/${notificationId}`);
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(
  notificationId: number,
): Promise<Notification> {
  return apiClient.put<Notification>(
    `/api/v1/notifications/${notificationId}/read`,
    {},
  );
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  return apiClient.put<void>("/api/v1/notifications/read-all", {});
}

/**
 * 알림 삭제
 */
export async function deleteNotification(
  notificationId: number,
): Promise<void> {
  return apiClient.delete<void>(`/api/v1/notifications/${notificationId}`);
}

/**
 * 읽지 않은 알림 개수 조회
 */
export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  return apiClient.get<{ count: number }>("/api/v1/notifications/unread/count");
}
