# STOMP WebSocket 클라이언트

`@stomp/stompjs` 라이브러리를 사용하여 STOMP WebSocket 통신을 구현합니다.

## 설치

```bash
npm install @stomp/stompjs
```

## 사용 방법

### 1. 기본 사용 (useStomp 훅)

```tsx
import { useStomp } from "@/hooks/useStomp";

function ChatComponent() {
  const { isConnected, subscribe, publish } = useStomp({
    onConnect: (client) => {
      // 콘솔 로그
    },
    onError: (error) => {
      console.error("STOMP 연결 오류:", error);
    },
  });

  useEffect(() => {
    if (!isConnected) return;

    // 채팅방 메시지 구독
    const unsubscribe = subscribe(`/sub/chat/room/${roomId}`, (message) => {
      const chatMessage = JSON.parse(message.body);
      // 콘솔 로그
      // 메시지 처리 로직
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, roomId, subscribe]);

  const handleSendMessage = () => {
    // 메시지 발행
    publish(`/pub/chat/message`, {
      roomId: roomId,
      content: "메시지 내용",
    });
  };
}
```

### 2. 직접 클라이언트 사용

```tsx
import { getStompClient } from "@/lib/websocket/stomp-client";

const client = getStompClient();
client.activate();

client.onConnect = () => {
  // 구독
  client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
    const chatMessage = JSON.parse(message.body);
    // 콘솔 로그
  });

  // 메시지 발행
  client.publish({
    destination: `/pub/chat/message`,
    body: JSON.stringify({
      roomId: roomId,
      content: "메시지 내용",
    }),
  });
};
```

## WebSocket URL 설정

기본적으로 `NEXT_PUBLIC_API_BASE_URL` 환경 변수를 사용하여 WebSocket URL을 생성합니다.

- HTTP: `http://localhost:8080` → `ws://localhost:8080/ws-chat`
- HTTPS: `https://api.example.com` → `wss://api.example.com/ws-chat`

WebSocket 엔드포인트가 다른 경우 `src/lib/websocket/stomp-client.ts`의 `getWebSocketUrl()` 함수를 수정하세요.

## 인증 및 쿠키

### 쿠키 인증 (권장)

WebSocket은 HTTP 요청을 업그레이드하는 방식이므로, 브라우저가 **자동으로 쿠키를 전송**합니다.

**프론트엔드**: 별도 설정 불필요 (브라우저가 자동 처리)

**백엔드 설정 필요 사항**:

1. **CORS 설정** (크로스 오리진인 경우):

```java
@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/sub", "/queue");
        config.setApplicationDestinationPrefixes("/pub");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
            .setAllowedOrigins("http://localhost:3000") // 프론트엔드 도메인
            .withSockJS(); // 또는 .setAllowedOriginPatterns("*") 사용 가능
    }
}
```

2. **세션 인증** (세션 기반 인증인 경우):

```java
@Component
public class WebSocketInterceptor implements HandshakeInterceptor {
    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        // HTTP 세션에서 사용자 정보 가져오기
        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            HttpSession session = servletRequest.getServletRequest().getSession();
            // 세션에서 사용자 정보를 가져와 WebSocket 세션에 저장
            attributes.put("userId", session.getAttribute("userId"));
        }
        return true;
    }
}
```

### 토큰 인증 (대안)

쿠키 대신 토큰을 사용하는 경우 `connectHeaders`에 추가:

```typescript
connectHeaders: {
  Authorization: `Bearer ${token}`,
}
```

## 백엔드 엔드포인트 예시

Spring Boot STOMP 일반적인 엔드포인트:

- **WebSocket 연결**: `ws://localhost:8080/ws-chat`
- **채팅방 구독**: `/sub/chat/room/{roomId}` (백엔드 구현에 따라 다를 수 있음)
- **메시지 발행**: `/pub/chat/message` (백엔드 구현에 따라 다를 수 있음)
- **개인 메시지 구독**: `/sub/user/{userId}/queue/messages` (백엔드 구현에 따라 다를 수 있음)

실제 엔드포인트는 백엔드 구현에 따라 다를 수 있으므로, 백엔드 개발자와 확인하세요.
