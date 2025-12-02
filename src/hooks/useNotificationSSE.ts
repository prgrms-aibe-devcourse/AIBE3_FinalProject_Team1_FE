/**
 * SSE(Server-Sent Events)를 통한 알림 실시간 수신 훅
 * 
 * 사이트 전체에서 계속 유지되는 전역 SSE 연결을 관리합니다.
 * - 자동 재연결 지원
 * - React Query 캐시 무효화
 * - 전역 상태(Zustand) 업데이트
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { NotificationResBody } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import { useNotificationStore } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";

// 전역 SSE 연결 인스턴스 (싱글톤)
let globalEventSource: EventSource | null = null;
let reconnectTimeoutId: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3초

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

// SSE는 일반 HTTP/HTTPS URL 사용 (EventSource는 ws:// 또는 wss:// 불필요)

export function useNotificationSSE() {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const queryClient = useQueryClient();
  const { hasUnread, setHasUnread } = useNotificationStore();
  const { isAuthenticated, user } = useAuthStore();

  /**
   * SSE 연결 종료 및 정리
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (globalEventSource) {
      globalEventSource.close();
      globalEventSource = null;
    }

    setIsConnected(false);
    reconnectAttempts = 0;
  }, []);

  /**
   * 알림 수신 핸들러
   */
  const handleNotification = useCallback(
    (notification: NotificationResBody) => {

      // 1. 전역 상태 업데이트 (읽지 않은 알림 여부)
      if (!notification.isRead) {
        setHasUnread(true);
      }

      // 2. 알림 목록 쿼리 완전히 리셋 (OFFSET 페이징 문제 방지)
      // 새 알림이 도착하면 처음부터 다시 조회하여 페이징 깨짐 방지
      const listQueryKey = getQueryKey(queryKeys.notification.list({}));
      queryClient.removeQueries({
        queryKey: listQueryKey,
      });

      // 3. 읽지 않은 알림 여부 쿼리 무효화 (전역 상태 업데이트를 위해)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.notification.unread),
      });
    },
    [queryClient, setHasUnread],
  );

  /**
   * SSE 연결 생성
   */
  const connect = useCallback(() => {
    // 인증되지 않았으면 연결하지 않음
    if (!isAuthenticated || !user?.id) {
      return;
    }

    // 이미 전역 인스턴스가 있으면 재사용
    if (globalEventSource) {
      eventSourceRef.current = globalEventSource;
      setIsConnected(globalEventSource.readyState === EventSource.OPEN);
      return;
    }

    // 이미 연결 중이면 재연결하지 않음
    if (
      eventSourceRef.current &&
      eventSourceRef.current.readyState === EventSource.CONNECTING
    ) {
      return;
    }

    const sseUrl = `${API_BASE_URL}/api/v1/notifications/subscribe`;

    try {
      const eventSource = new EventSource(sseUrl, {
        withCredentials: true, // 쿠키 포함
      });

      globalEventSource = eventSource;
      eventSourceRef.current = eventSource;

      // 연결 성공
      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttempts = 0; // 재연결 성공 시 카운터 리셋
      };

      // 메시지 수신
      eventSource.onmessage = (event) => {
        try {
          const data = event.data;

          // 처음 연결 시 "connected" 메시지는 무시
          if (data === "connected") {
            return;
          }

          // 알림 데이터 파싱 및 처리
          const notification: NotificationResBody = JSON.parse(data);
          handleNotification(notification);
        } catch (error) {
          console.error("[SSE] 메시지 파싱 오류:", error);
        }
      };

      // 에러 처리
      eventSource.onerror = (error) => {
        console.error("[SSE] 연결 오류:", error);
        setIsConnected(false);

        // 연결이 종료된 경우 재연결 시도
        if (eventSource.readyState === EventSource.CLOSED) {
          disconnect();

          // 최대 재시도 횟수 체크
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = RECONNECT_DELAY * reconnectAttempts; // 지수 백오프

            reconnectTimeoutId = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error(
              `[SSE] 최대 재연결 시도 횟수(${MAX_RECONNECT_ATTEMPTS}) 초과`,
            );
          }
        }
      };
    } catch (error) {
      console.error("[SSE] 연결 생성 오류:", error);
    }
  }, [isAuthenticated, user?.id, handleNotification, disconnect]);

  // 인증 상태 변경 시 연결/해제
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      // 컴포넌트 언마운트 시 전역 인스턴스가 현재 인스턴스인 경우에만 정리
      // (다른 컴포넌트에서 사용 중일 수 있으므로)
      if (eventSourceRef.current === globalEventSource) {
        // 전역 인스턴스는 유지하되, 참조만 해제
        eventSourceRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id, connect, disconnect]);

  // 페이지 언로드 시 연결 종료
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [disconnect]);

  return {
    isConnected,
    hasUnread,
    reconnect: connect,
    disconnect,
  };
}

