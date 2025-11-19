// src/hooks/useStomp.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let globalClient: Client | null = null;

export function useStomp() {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

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
      onStompError: (err) => console.error("[STOMP] Error:", err),
      
      // ⭐ 디버깅용 (선택사항)
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
  }, []);

  return { isConnected, subscribe, publish };
}
