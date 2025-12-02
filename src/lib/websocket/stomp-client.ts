/**
 * STOMP WebSocket 클라이언트 유틸리티
 */
import { Client } from "@stomp/stompjs";

/**
 * WebSocket URL 생성
 * NEXT_PUBLIC_WS_BASE_URL 환경 변수를 사용
 */
function getWebSocketUrl(): string {
  const wsBaseUrl =
    process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8080/ws-chat";
  return wsBaseUrl;
}

/**
 * STOMP 클라이언트 생성
 */
export function createStompClient() {
  const client = new Client({
    brokerURL: getWebSocketUrl(),
    reconnectDelay: 5000, // 재연결 지연 시간 (5초)
    heartbeatIncoming: 4000, // 하트비트 수신 간격 (4초)
    heartbeatOutgoing: 4000, // 하트비트 송신 간격 (4초)
    debug: () => {
      // 디버그 로그 비활성화
    },
    // WebSocket 연결 시 자동으로 인증 헤더 추가 (필요 시)
    connectHeaders: {
      // 인증이 필요한 경우 여기에 헤더 추가
      // Authorization: `Bearer ${token}` 등
    },
    // WebSocket 연결 실패 시 자동 재연결
    onConnect: () => {
      // 연결 성공
    },
    onStompError: (frame) => {
      console.error("[STOMP] Error:", frame);
    },
    onWebSocketError: (event) => {
      console.error("[STOMP] WebSocket Error:", event);
    },
    onDisconnect: () => {
      // 연결 해제
    },
  });

  return client;
}

/**
 * STOMP 클라이언트 인스턴스 (싱글톤)
 */
let stompClient: Client | null = null;

/**
 * STOMP 클라이언트 인스턴스 가져오기
 */
export function getStompClient(): Client {
  if (!stompClient) {
    stompClient = createStompClient();
  }
  return stompClient;
}

/**
 * STOMP 클라이언트 연결
 */
export async function connectStompClient(): Promise<Client> {
  const client = getStompClient();
  if (!client.connected) {
    client.activate();
    // 연결이 완료될 때까지 대기
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("STOMP connection timeout"));
      }, 10000);

      client.onConnect = () => {
        clearTimeout(timeout);
        resolve(client);
      };

      client.onStompError = (frame) => {
        clearTimeout(timeout);
        reject(new Error(frame.headers["message"] || "STOMP connection error"));
      };
    });
  }
  return client;
}

/**
 * STOMP 클라이언트 연결 해제
 */
export function disconnectStompClient(): void {
  if (stompClient && stompClient.connected) {
    stompClient.deactivate();
  }
}

/**
 * STOMP 클라이언트 정리
 */
export function destroyStompClient(): void {
  if (stompClient) {
    disconnectStompClient();
    stompClient = null;
  }
}
