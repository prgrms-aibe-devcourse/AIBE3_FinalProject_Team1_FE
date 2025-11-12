/**
 * 알림 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { PaginatedApiResponse } from "@/types/api";
import type { Notification } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  deleteNotification,
  getNotification,
  getNotificationList,
  getUnreadNotificationCount,
  getUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/api/endpoints/notification";

/**
 * 알림 목록 조회 query
 */
export function useNotificationListQuery(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.notification.all),
    queryFn: async (): Promise<Notification[] | PaginatedApiResponse<Notification>> => {
      return getNotificationList(filters);
    },
    staleTime: 1000 * 30, // 30초간 fresh 상태 유지 (알림은 자주 업데이트)
    refetchInterval: 1000 * 30, // 30초마다 자동 refetch
  });
}

/**
 * 읽지 않은 알림 목록 조회 query
 */
export function useUnreadNotificationsQuery(
  filters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.notification.unread),
    queryFn: async (): Promise<PaginatedApiResponse<Notification>> => {
      return getUnreadNotifications(filters);
    },
    staleTime: 1000 * 30, // 30초간 fresh 상태 유지
    refetchInterval: 1000 * 30, // 30초마다 자동 refetch
  });
}

/**
 * 알림 상세 조회 query
 */
export function useNotificationQuery(notificationId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.notification.detail(notificationId)),
    queryFn: async (): Promise<Notification> => {
      const response = await getNotification(notificationId);
      return response;
    },
    enabled: !!notificationId, // notificationId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
  });
}

/**
 * 읽지 않은 알림 개수 조회 query
 */
export function useUnreadNotificationCountQuery() {
  return useQuery({
    queryKey: getQueryKey(queryKeys.notification.unread),
    queryFn: async (): Promise<number> => {
      const response = await getUnreadNotificationCount();
      return response.count;
    },
    staleTime: 1000 * 30, // 30초간 fresh 상태 유지
    refetchInterval: 1000 * 30, // 30초마다 자동 refetch
  });
}

/**
 * 알림 읽음 처리 mutation
 */
export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) =>
      markNotificationAsRead(notificationId),
    onSuccess: (response, notificationId) => {
      // 알림 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.notification.detail(notificationId)),
        response,
      );
      // 알림 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.notification.all),
      });
      // 읽지 않은 알림 목록 및 개수 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.notification.unread),
      });
    },
    onError: (error) => {
      console.error("Mark notification as read error:", error);
    },
  });
}

/**
 * 모든 알림 읽음 처리 mutation
 */
export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      // 모든 알림 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.notification.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.notification.unread),
      });
    },
    onError: (error) => {
      console.error("Mark all notifications as read error:", error);
    },
  });
}

/**
 * 알림 삭제 mutation
 */
export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => deleteNotification(notificationId),
    onSuccess: (_, notificationId) => {
      // 알림 상세 쿼리 제거
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.notification.detail(notificationId)),
      });
      // 알림 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.notification.all),
      });
      // 읽지 않은 알림 목록 및 개수 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.notification.unread),
      });
    },
    onError: (error) => {
      console.error("Delete notification error:", error);
    },
  });
}

