// src/hooks/useStomp.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";

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

    const client = new Client({
      brokerURL:
        process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws-chat",
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
