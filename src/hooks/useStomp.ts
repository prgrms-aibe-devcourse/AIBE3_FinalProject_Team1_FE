// src/hooks/useStomp.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { useAuthStore } from "@/store/authStore";

let globalClient: Client | null = null;
let reconnectAttempts = 0;
let clientRefCount = 0; // 클라이언트를 사용하는 컴포넌트 수
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3초

export function useStomp() {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthenticatedRef = useRef(isAuthenticated);

  // isAuthenticated 값을 ref에 동기화
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const subscribe = useCallback(
    (destination: string, callback: (msg: IMessage) => void) => {
      const client = clientRef.current;
      if (!client || !client.connected) {
        console.warn("[STOMP] subscribe before ready:", destination);
        return () => {};
      }
      const sub = client.subscribe(destination, callback);
      return () => sub.unsubscribe();
    },
    [],
  );

 const publish = useCallback(
  (destination: string, body: Record<string, unknown>) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      console.warn("[STOMP] publish before connected:", destination);
      return;
    }
    client.publish({ destination, body: JSON.stringify(body) });
  }, []);

  useEffect(() => {
    // 로그인하지 않았으면 연결하지 않음
    if (!isAuthenticated) {
      return;
    }

    // 이미 글로벌 인스턴스가 있고 연결되어 있으면 재사용
    if (globalClient && globalClient.connected) {
      clientRef.current = globalClient;
      setIsConnected(true);
      clientRefCount++;
      return () => {
        clientRefCount--;
        // 마지막 컴포넌트가 unmount될 때만 cleanup
        if (clientRefCount <= 0 && globalClient) {
          globalClient.deactivate();
          globalClient = null;
          clientRefCount = 0;
        }
      };
    }

    // 이미 글로벌 인스턴스가 있지만 연결되지 않은 경우 재사용 (재연결 중일 수 있음)
    if (globalClient) {
      clientRef.current = globalClient;
      setIsConnected(globalClient.connected);
      clientRefCount++;
      return () => {
        clientRefCount--;
        // 마지막 컴포넌트가 unmount될 때만 cleanup
        if (clientRefCount <= 0 && globalClient) {
          globalClient.deactivate();
          globalClient = null;
          clientRefCount = 0;
        }
      };
    }

    // ⭐ 환경변수에서 URL 가져오기 (주의: http/https 사용!)
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_BASE_URL || "http://localhost:8080/ws-chat";

    const client = new Client({
      // ⭐ brokerURL 대신 webSocketFactory 사용
      webSocketFactory: () => new SockJS(wsUrl, null, {
        transports: ['xhr-streaming', 'xhr-polling']  // ⭐ WebSocket 제외
      }),
      
      reconnectDelay: RECONNECT_DELAY,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        setIsConnected(true);
        reconnectAttempts = 0; // 연결 성공 시 카운터 리셋
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onWebSocketError: (event) => {
        console.error("[STOMP] WebSocket Error:", event);
        
        // 재시도 횟수 체크
        reconnectAttempts++;
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error(
            `[STOMP] 최대 재연결 시도 횟수(${MAX_RECONNECT_ATTEMPTS}) 초과, 재연결 중지`,
          );
          if (globalClient) {
            globalClient.deactivate();
            globalClient = null;
          }
        }
      },
      onStompError: (err) => {
        console.error("[STOMP] Error:", err);
        
        // 인증 에러 시 재연결 중지
        if (err.headers?.message?.includes("401") || 
            err.headers?.message?.includes("UNAUTHORIZED") ||
            !isAuthenticatedRef.current) {
          if (globalClient) {
            globalClient.deactivate();
            globalClient = null;
          }
          reconnectAttempts = 0; // 인증 에러는 재시도 카운터 리셋
        } else {
          // 기타 에러 시 재시도 횟수 체크
          reconnectAttempts++;
          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error(
              `[STOMP] 최대 재연결 시도 횟수(${MAX_RECONNECT_ATTEMPTS}) 초과, 재연결 중지`,
            );
            if (globalClient) {
              globalClient.deactivate();
              globalClient = null;
            }
          }
        }
      },
    });

    globalClient = client;
    clientRef.current = client;
    reconnectAttempts = 0; // 새 연결 시도 시 카운터 리셋
    clientRefCount++;
    client.activate();

    return () => {
      clientRefCount--;
      // 마지막 컴포넌트가 unmount될 때만 cleanup
      if (clientRefCount <= 0 && client === globalClient) {
        client.deactivate();
        globalClient = null;
        clientRefCount = 0;
      }
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  // 로그아웃 시 연결 해제
  useEffect(() => {
    if (!isAuthenticated && globalClient) {
      globalClient.deactivate();
      globalClient = null;
      clientRef.current = null;
      setIsConnected(false);
      reconnectAttempts = 0; // 로그아웃 시 카운터 리셋
    }
  }, [isAuthenticated]);

  return { isConnected, subscribe, publish };
}
