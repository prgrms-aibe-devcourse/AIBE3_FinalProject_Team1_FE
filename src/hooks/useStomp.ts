/**
 * STOMP WebSocket 훅
 */
import { useEffect, useRef, useState } from "react";

import type { Client, IMessage } from "@stomp/stompjs";

import {
  connectStompClient,
  getStompClient,
} from "@/lib/websocket/stomp-client";

interface UseStompOptions {
  onConnect?: (client: Client) => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * STOMP 클라이언트 훅
 */
export function useStomp(options?: UseStompOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, { unsubscribe: () => void }>>(
    new Map(),
  );

  // 연결
  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        const client = await connectStompClient();
        if (mounted) {
          clientRef.current = client;
          setIsConnected(true);
          setError(null);
          options?.onConnect?.(client);
        }
      } catch (err) {
        if (mounted) {
          const error =
            err instanceof Error
              ? err
              : new Error("STOMP connection failed");
          setError(error);
          setIsConnected(false);
          options?.onError?.(error);
        }
      }
    };

    // 이미 연결되어 있으면 상태만 업데이트
    const client = getStompClient();
    if (client.connected) {
      clientRef.current = client;
      setIsConnected(true);
      options?.onConnect?.(client);
    } else {
      connect();
    }

    // cleanup 함수에서 사용할 구독 맵 복사
    const subscriptions = subscriptionsRef.current;

    return () => {
      mounted = false;
      // 모든 구독 해제
      subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      subscriptions.clear();
      // 클라이언트는 연결 해제하지 않음 (싱글톤이므로 다른 컴포넌트에서 사용할 수 있음)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 구독
  const subscribe = (
    destination: string,
    callback: (message: IMessage) => void,
  ) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn("[STOMP] Client is not connected");
      return () => {};
    }

    // 이미 구독 중인 경우 기존 구독 해제
    if (subscriptionsRef.current.has(destination)) {
      subscriptionsRef.current.get(destination)?.unsubscribe();
    }

    const subscription = clientRef.current.subscribe(destination, callback);
    subscriptionsRef.current.set(destination, subscription);

    return () => {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(destination);
    };
  };

  // 메시지 발행
  const publish = (
    destination: string,
    body: Record<string, unknown> | string,
    headers?: Record<string, unknown>,
  ) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn("[STOMP] Client is not connected");
      return;
    }

    const messageBody =
      typeof body === "string" ? body : JSON.stringify(body);

    clientRef.current.publish({
      destination,
      body: messageBody,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
    });
  };

  return {
    isConnected,
    error,
    subscribe,
    publish,
    client: clientRef.current,
  };
}
