// src/hooks/useStomp.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { useAuthStore } from "@/store/authStore";

let globalClient: Client | null = null;

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
    // 이미 글로벌 인스턴스가 있으면 재사용
    if (globalClient) {
      clientRef.current = globalClient;
      setIsConnected(globalClient.connected);
      return;
    }

    // 로그인하지 않았으면 연결하지 않음
    if (!isAuthenticated) {
      console.log("[STOMP] Skip connection - not authenticated");
      return;
    }

    console.log("[STOMP] Initializing new connection");

    // ⭐ 환경변수에서 URL 가져오기 (주의: http/https 사용!)
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_BASE_URL || "http://localhost:8080/ws-chat";

    const client = new Client({
      // ⭐ brokerURL 대신 webSocketFactory 사용
      webSocketFactory: () => new SockJS(wsUrl, null, {
        transports: ['xhr-streaming', 'xhr-polling']  // ⭐ WebSocket 제외
      }),
      
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        console.log("[STOMP] Connected");
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log("[STOMP] Disconnected");
        setIsConnected(false);
      },
      onStompError: (err) => {
        console.error("[STOMP] Error:", err);
        
        // 인증 에러 시 재연결 중지
        if (err.headers?.message?.includes("401") || 
            err.headers?.message?.includes("UNAUTHORIZED") ||
            !isAuthenticatedRef.current) {
          console.log("[STOMP] Auth error or logged out, stopping reconnection");
          if (globalClient) {
            globalClient.deactivate();
            globalClient = null;
          }
        }
      },
      
      // ⭐ 디버깅용 (선택사항) - 프로덕션에서는 제거 권장
      debug: (str) => {
        console.log("[STOMP Debug]", str);
      },
    });

    globalClient = client;
    clientRef.current = client;
    client.activate();

    return () => {
      if (client === globalClient) {
        console.log("[STOMP] Deactivating global client...");
        client.deactivate();
        globalClient = null;
      }
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  // 로그아웃 시 연결 해제
  useEffect(() => {
    if (!isAuthenticated && globalClient) {
      console.log("[STOMP] User logged out, deactivating client");
      globalClient.deactivate();
      globalClient = null;
      clientRef.current = null;
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  return { isConnected, subscribe, publish };
}
