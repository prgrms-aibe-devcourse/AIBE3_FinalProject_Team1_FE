/**
 * 알림 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type {
  NotificationData,
  NotificationResBody,
  NotificationUnreadResBody,
} from "@/types/domain";

import { buildQueryParams } from "@/lib/utils/api-params";

import { apiClient } from "@/api/client";

/**
 * 알림 목록 조회
 * @param pageable 페이지네이션 파라미터 (page, size, sort 등)
 * @returns 페이지네이션된 알림 목록
 */
export async function getNotifications(pageable?: {
  page?: number;
  size?: number;
  sort?: string; // "createdAt,DESC" 형식
}): Promise<PaginatedApiResponse<NotificationResBody<NotificationData>>> {
  const params = buildQueryParams(pageable);
  const endpoint = `/api/v1/notifications${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<
    PaginatedApiResponse<NotificationResBody<NotificationData>>
  >(endpoint);
}

/**
 * 읽지 않은 알림 여부 조회
 * @returns 읽지 않은 알림 존재 여부
 */
export async function hasUnreadNotifications(): Promise<NotificationUnreadResBody> {
  return apiClient.get<NotificationUnreadResBody>(
    "/api/v1/notifications/unread",
  );
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  return apiClient.post<void>("/api/v1/notifications", {});
}

/**
 * 특정 알림 읽음 처리
 * @param notificationId 알림 ID
 */
export async function markNotificationAsRead(
  notificationId: number,
): Promise<void> {
  return apiClient.post<void>(`/api/v1/notifications/${notificationId}`, {});
}
