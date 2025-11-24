"use client";

/**
 * 알림 목록 페이지
 * 무한 스크롤로 알림을 20개씩 조회
 */
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useRef } from "react";

import type { NotificationResBody } from "@/types/domain";

import { formatNotificationMessage } from "@/lib/utils/notification";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";

import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsInfiniteQuery,
} from "@/queries/notification";

import { Bell, CheckCheck } from "lucide-react";

function NotificationItem({
  notification,
}: {
  notification: NotificationResBody;
}) {
  const markAsReadMutation = useMarkNotificationAsReadMutation();

  const handleMarkAsRead = () => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const createdAt = new Date(notification.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: ko,
  });

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        notification.isRead
          ? "bg-white hover:bg-gray-50"
          : "bg-blue-50 hover:bg-blue-100"
      }`}
      onClick={handleMarkAsRead}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-blue-500" />
              )}
              <span className="text-sm font-medium text-gray-600">
                {formatNotificationMessage(notification)}
              </span>
            </div>
            <p className="text-xs text-gray-500">{timeAgo}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const { hasUnread } = useNotificationStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useNotificationsInfiniteQuery({
      enabled: isAuthenticated,
    });

  const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation();

  // 알림 목록 데이터 평탄화
  const notifications = data?.pages.flatMap((page) => page.content) ?? [];

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // 무한 스크롤: Intersection Observer 사용
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Bell className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            알림을 확인하려면 로그인하세요
          </h2>
          <p className="text-gray-500">로그인 후 알림을 확인할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">알림</h1>
          {hasUnread && <span className="h-2 w-2 rounded-full bg-red-500" />}
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              모두 읽음 처리
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Bell className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            알림이 없습니다
          </h2>
          <p className="text-gray-500">
            새로운 알림이 도착하면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>

          {/* 무한 스크롤 트리거 */}
          <div ref={loadMoreRef} className="py-4">
            {isFetchingNextPage && (
              <div className="text-center text-gray-500">
                알림을 불러오는 중...
              </div>
            )}
            {!hasNextPage && notifications.length > 0 && (
              <div className="text-center text-gray-500">
                모든 알림을 불러왔습니다.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
