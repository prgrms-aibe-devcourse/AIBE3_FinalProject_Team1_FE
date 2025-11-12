# API 경로 확인 필요

현재 구현된 API 경로와 실제 API 명세서를 비교하여 수정이 필요합니다.

## 현재 구현된 경로 구조

### 인증
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/signup`

### 사용자 (Members)
- `GET /api/v1/members`
- `GET /api/v1/members/:id`
- `GET /api/v1/members/me`
- `PUT /api/v1/members/me`
- `PUT /api/v1/members/:id`
- `DELETE /api/v1/members/:id`
- `PUT /api/v1/members/:id/ban`
- `PUT /api/v1/members/:id/unban`

### 게시글 (Posts)
- `GET /api/v1/posts`
- `GET /api/v1/posts/:id`
- `POST /api/v1/posts`
- `PUT /api/v1/posts/:id`
- `DELETE /api/v1/posts/:id`
- `GET /api/v1/posts/me`
- `GET /api/v1/posts/category/:categoryId`
- `GET /api/v1/posts/region/:regionId`

### 게시글 즐겨찾기
- `GET /api/v1/posts/favorites`
- `POST /api/v1/posts/:postId/favorites`
- `DELETE /api/v1/posts/:postId/favorites`
- `GET /api/v1/posts/:postId/favorites/check`

### 예약 (Reservations)
- `GET /api/v1/reservations`
- `GET /api/v1/reservations/:id`
- `POST /api/v1/reservations`
- `PUT /api/v1/reservations/:id`
- `DELETE /api/v1/reservations/:id`
- `GET /api/v1/reservations/me`
- `GET /api/v1/posts/:postId/reservations`
- `PUT /api/v1/reservations/:id/approve`
- `PUT /api/v1/reservations/:id/reject`
- `PUT /api/v1/reservations/:id/cancel`

### 후기 (Reviews)
- `GET /api/v1/reviews`
- `GET /api/v1/reviews/:id`
- `POST /api/v1/reviews`
- `PUT /api/v1/reviews/:id`
- `DELETE /api/v1/reviews/:id`
- `GET /api/v1/posts/:postId/reviews`
- `GET /api/v1/reservations/:reservationId/review`

### 채팅 (Chat)
- `GET /api/v1/chat/rooms`
- `GET /api/v1/chat/rooms/:id`
- `POST /api/v1/posts/:postId/chat/rooms`
- `DELETE /api/v1/chat/rooms/:id`
- `GET /api/v1/chat/rooms/:roomId/messages`
- `POST /api/v1/chat/rooms/:roomId/messages`
- `DELETE /api/v1/chat/rooms/:roomId/messages/:messageId`
- `PUT /api/v1/chat/rooms/:roomId/read`

### 카테고리 (Categories)
- `GET /api/v1/categories`
- `GET /api/v1/categories/:id`
- `GET /api/v1/categories/tree`
- `POST /api/v1/categories`
- `PUT /api/v1/categories/:id`
- `DELETE /api/v1/categories/:id`

### 지역 (Regions)
- `GET /api/v1/regions`
- `GET /api/v1/regions/:id`
- `GET /api/v1/regions/tree`
- `POST /api/v1/regions`
- `PUT /api/v1/regions/:id`
- `DELETE /api/v1/regions/:id`

### 알림 (Notifications)
- `GET /api/v1/notifications`
- `GET /api/v1/notifications/:id`
- `PUT /api/v1/notifications/:id/read`
- `PUT /api/v1/notifications/read-all`
- `DELETE /api/v1/notifications/:id`
- `GET /api/v1/notifications/unread/count`

### 신고 (Reports)
- `GET /api/v1/reports`
- `GET /api/v1/reports/:id`
- `POST /api/v1/reports`
- `DELETE /api/v1/reports/:id`
- `GET /api/v1/reports/me`

### 파일 업로드 (Upload)
- `POST /api/v1/upload`
- `POST /api/v1/upload/multiple`
- `POST /api/v1/upload/profile`

## 확인 필요 사항

실제 API 명세서와 비교하여 다음을 확인해주세요:

1. 리소스 이름이 다른가요? (예: `members` vs `users`)
2. 특정 엔드포인트 경로가 다른가요?
3. 중첩 경로 구조가 다른가요?
4. 추가/누락된 엔드포인트가 있나요?

명세서의 실제 경로를 알려주시면 바로 수정하겠습니다!

