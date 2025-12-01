/**
 * 알림 관련 React Query 쿼리
 *
 * ⚠️ SSE/WebSocket을 통한 실시간 알림 수신 시:
 * 1. 전역 상태(Zustand)로 읽지 않은 알림 여부를 관리
 * 2. SSE 이벤트 핸들러에서 queryClient.invalidateQueries() 호출하여 쿼리 무효화
 * 3. 알림 목록 페이지 접근/새로고침/새 알림 확인 버튼 클릭 시 수동 refetch
 *
 * refetchInterval은 제거했음 (SSE가 있으므로 주기적 refetch 불필요)
 */
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";

import type { ApiError, PaginatedApiResponse } from "@/types/api";
import type {
  NotificationData,
  NotificationResBody,
  NotificationUnreadResBody,
} from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  getNotifications,
  hasUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/api/endpoints/notification";

import { useNotificationStore } from "@/store/notificationStore";
import { useUIStore } from "@/store/uiStore";

/**
 * 최근 알림 목록 조회 query (마이페이지용)
 * @param size 가져올 알림 개수 (기본값: 5)
 */
export function useRecentNotificationsQuery(size: number = 5) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.notification.list({})).concat([
      "recent",
      size,
    ]),
    queryFn: async () => {
      return getNotifications({
        page: 0,
        size: size,
        sort: "createdAt,DESC",
      });
    },
    staleTime: 1000 * 60, // 1분간 fresh 상태 유지
    gcTime: 1000 * 60 * 5, // 5분간 캐시 유지
    refetchOnWindowFocus: true,
  });
}

/**
 * 알림 목록 조회 query (무한 스크롤)
 *
 * SSE로 실시간 알림이 도착하면:
 * - 전역 상태(Zustand) 업데이트 (읽지 않은 알림 여부)
 * - queryClient.invalidateQueries(queryKeys.notification.list()) 호출하여 이 쿼리 무효화
 * - 페이지에 포커스가 있으면 자동으로 refetch됨
 *
 * @param options 쿼리 옵션
 */
export function useNotificationsInfiniteQuery(options?: {
  enabled?: boolean; // 쿼리 활성화 여부
}) {
  return useInfiniteQuery({
    queryKey: getQueryKey(queryKeys.notification.list({})),
    queryFn: async ({ pageParam = 0 }) => {
      return getNotifications({
        page: pageParam,
        size: 20,
        sort: "createdAt,DESC",
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.page.hasNext ? lastPage.page.page + 1 : undefined;
    },
    enabled: options?.enabled ?? true,
    staleTime: 0, // SSE로 즉시 업데이트가 필요하므로 staleTime을 0으로 설정
    gcTime: 1000 * 60 * 5, // 5분간 캐시 유지
    refetchOnWindowFocus: true, // 페이지 포커스 시 refetch
    // refetchInterval 제거: SSE가 있으므로 주기적 refetch 불필요
  });
}

/**
 * 읽지 않은 알림 여부 조회 query
 *
 * ⚠️ 이 쿼리는 서버에서 최신 상태를 가져와 전역 상태를 업데이트하는 용도입니다.
 * 실시간 상태이므로 캐싱하지 않고, 필요시에만 호출합니다.
 *
 * UI에서는 전역 상태(useNotificationStore)를 직접 구독하여 사용하세요.
 * SSE로 실시간 업데이트가 있으므로 이 쿼리는 초기 로딩 시에만 사용하는 것을 권장합니다.
 *
 * @param options 쿼리 옵션
 */
export function useHasUnreadNotificationsQuery(options?: {
  enabled?: boolean;
}) {
  const { setHasUnread } = useNotificationStore();

  const queryResult = useQuery({
    queryKey: getQueryKey(queryKeys.notification.unread),
    queryFn: async (): Promise<NotificationUnreadResBody> => {
      return hasUnreadNotifications();
    },
    enabled: options?.enabled ?? true,
    staleTime: 0, // 항상 stale로 간주 (캐시 사용 안 함)
    gcTime: 0, // 캐시를 유지하지 않음 (메모리에서 즉시 제거)
    refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 안 함 (SSE가 있으므로)
    refetchOnMount: true, // 마운트 시 항상 refetch
    refetchOnReconnect: false, // 재연결 시 refetch 안 함 (SSE가 자동 재연결)
  });

  // API 응답을 받으면 전역 상태에 반영
  useEffect(() => {
    if (queryResult.data) {
      setHasUnread(queryResult.data.hasUnread);
    }
  }, [queryResult.data, setHasUnread]);

  return queryResult;
}

/**
 * 모든 알림 읽음 처리 mutation
 */
export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onMutate: async () => {
      // 진행 중인 모든 알림 쿼리 취소
      await queryClient.cancelQueries({
        queryKey: getQueryKey(queryKeys.notification.all),
      });

      // 낙관적 업데이트: 모든 알림을 읽음 처리
      const queryKey = getQueryKey(queryKeys.notification.list({}));
      queryClient.setQueryData<
        InfiniteData<
          PaginatedApiResponse<NotificationResBody<NotificationData>>
        >
      >(queryKey, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            content: page.content.map((notification) => ({
              ...notification,
              isRead: true,
            })),
          })),
        };
      });
    },
    onSuccess: async () => {
      // 모든 알림 관련 쿼리 무효화 (서버와 동기화)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.notification.all),
      });

      // 읽지 않은 알림 여부 API 호출하여 전역 상태 업데이트
      try {
        const result = await hasUnreadNotifications();
        const { setHasUnread } = useNotificationStore.getState();
        setHasUnread(result.hasUnread);
      } catch (error) {
        console.error("Failed to check unread notifications:", error);
      }

      showToast("모든 알림을 읽음 처리했습니다.", "success");
    },
    onError: (error: unknown) => {
      // 에러 발생 시 쿼리 무효화하여 원래 상태로 복구
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.notification.all),
      });

      console.error("Mark all notifications as read error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "알림 읽음 처리에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 특정 알림 읽음 처리 mutation
 */
export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (notificationId: number) =>
      markNotificationAsRead(notificationId),
    onMutate: async (notificationId: number) => {
      // 진행 중인 모든 알림 쿼리 취소
      await queryClient.cancelQueries({
        queryKey: getQueryKey(queryKeys.notification.all),
      });

      // 낙관적 업데이트: 특정 알림을 읽음 처리
      const queryKey = getQueryKey(queryKeys.notification.list({}));
      queryClient.setQueryData<
        InfiniteData<
          PaginatedApiResponse<NotificationResBody<NotificationData>>
        >
      >(queryKey, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            content: page.content.map((notification) =>
              notification.id === notificationId
                ? { ...notification, isRead: true }
                : notification,
            ),
          })),
        };
      });
    },
    onSuccess: async () => {
      // 모든 알림 관련 쿼리 무효화 (서버와 동기화)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.notification.all),
      });

      // 읽지 않은 알림 여부 API 호출하여 전역 상태 업데이트
      try {
        const result = await hasUnreadNotifications();
        const { setHasUnread } = useNotificationStore.getState();
        setHasUnread(result.hasUnread);
      } catch (error) {
        console.error("Failed to check unread notifications:", error);
      }

      showToast("알림을 읽음 처리했습니다.", "success");
    },
    onError: (error: unknown) => {
      // 에러 발생 시 쿼리 무효화하여 원래 상태로 복구
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.notification.all),
      });

      console.error("Mark notification as read error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "알림 읽음 처리에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 알림 목록 수동 refetch
 *
 * 새 알림 확인 버튼 클릭 등에서 사용
 *
 * @example
 * const queryClient = useQueryClient();
 * const refetchNotifications = () => {
 *   queryClient.invalidateQueries({
 *     queryKey: getQueryKey(queryKeys.notification.list()),
 *   });
 * };
 */
export function useRefetchNotifications() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: getQueryKey(queryKeys.notification.all),
    });
  };
}
