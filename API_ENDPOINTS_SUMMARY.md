# API 엔드포인트 함수 생성 완료

ERD 기반으로 모든 도메인 API 엔드포인트 함수를 생성했습니다.

## 생성된 파일 목록

### 1. 인증 (Auth)

- `src/api/endpoints/auth.ts`
  - `login()` - 로그인
  - `logout()` - 로그아웃
  - `signup()` - 회원가입 (CreateMemberDto 사용)

### 2. 사용자 (User)

- `src/api/endpoints/user.ts`
  - `getUserList()` - 사용자 목록 조회 (관리자용)
  - `getUser()` - 사용자 상세 조회
  - `getMe()` - 현재 로그인한 사용자 정보 조회
  - `updateUser()` - 사용자 정보 수정
  - `updateUserByAdmin()` - 사용자 정보 수정 (관리자용)
  - `deleteUser()` - 사용자 삭제 (관리자용)
  - `banUser()` - 사용자 제재 (관리자용)
  - `unbanUser()` - 사용자 제재 해제 (관리자용)

### 3. 게시글 (Post)

- `src/api/endpoints/post.ts`
  - `getPostList()` - 게시글 목록 조회 (필터 지원)
  - `getPost()` - 게시글 상세 조회
  - `createPost()` - 게시글 생성
  - `updatePost()` - 게시글 수정
  - `deletePost()` - 게시글 삭제
  - `getMyPosts()` - 내 게시글 목록 조회
  - `getPostsByCategory()` - 카테고리별 게시글 목록 조회
  - `getPostsByRegion()` - 지역별 게시글 목록 조회

### 4. 게시글 즐겨찾기 (PostFavorite)

- `src/api/endpoints/post-favorite.ts`
  - `getFavoritePosts()` - 즐겨찾기한 게시글 목록 조회
  - `addFavorite()` - 게시글 즐겨찾기 추가
  - `removeFavorite()` - 게시글 즐겨찾기 제거
  - `checkFavorite()` - 즐겨찾기 여부 확인

### 5. 예약 (Reservation)

- `src/api/endpoints/reservation.ts`
  - `getReservationList()` - 예약 목록 조회
  - `getReservation()` - 예약 상세 조회
  - `createReservation()` - 예약 생성
  - `updateReservation()` - 예약 수정
  - `deleteReservation()` - 예약 삭제
  - `getMyReservations()` - 내 예약 목록 조회
  - `getReservationsByPost()` - 게시글별 예약 목록 조회
  - `approveReservation()` - 예약 승인
  - `rejectReservation()` - 예약 거절
  - `cancelReservation()` - 예약 취소
  - `getReservationsByStatus()` - 상태별 예약 목록 조회

### 6. 후기 (Review)

- `src/api/endpoints/review.ts`
  - `getReviewList()` - 후기 목록 조회
  - `getReview()` - 후기 상세 조회
  - `createReview()` - 후기 생성
  - `updateReview()` - 후기 수정
  - `deleteReview()` - 후기 삭제
  - `getReviewsByPost()` - 게시글별 후기 목록 조회
  - `getReviewByReservation()` - 예약별 후기 조회

### 7. 채팅 (Chat)

- `src/api/endpoints/chat.ts`
  - `getChatRoomList()` - 채팅방 목록 조회
  - `getChatRoom()` - 채팅방 상세 조회
  - `getOrCreateChatRoom()` - 게시글별 채팅방 조회 또는 생성
  - `deleteChatRoom()` - 채팅방 삭제
  - `getChatMessages()` - 채팅 메시지 목록 조회
  - `createChatMessage()` - 채팅 메시지 생성
  - `deleteChatMessage()` - 채팅 메시지 삭제
  - `markChatRoomAsRead()` - 채팅방 읽음 처리

### 8. 카테고리 (Category)

- `src/api/endpoints/category.ts`
  - `getCategoryList()` - 카테고리 목록 조회
  - `getCategory()` - 카테고리 상세 조회
  - `getCategoryTree()` - 카테고리 트리 조회 (계층 구조)
  - `createCategory()` - 카테고리 생성 (관리자용)
  - `updateCategory()` - 카테고리 수정 (관리자용)
  - `deleteCategory()` - 카테고리 삭제 (관리자용)

### 9. 지역 (Region)

- `src/api/endpoints/region.ts`
  - `getRegionList()` - 지역 목록 조회
  - `getRegion()` - 지역 상세 조회
  - `getRegionTree()` - 지역 트리 조회 (계층 구조)
  - `createRegion()` - 지역 생성 (관리자용)
  - `updateRegion()` - 지역 수정 (관리자용)
  - `deleteRegion()` - 지역 삭제 (관리자용)

### 10. 알림 (Notification)

- `src/api/endpoints/notification.ts`
  - `getNotificationList()` - 알림 목록 조회
  - `getUnreadNotifications()` - 읽지 않은 알림 목록 조회
  - `getNotification()` - 알림 상세 조회
  - `markNotificationAsRead()` - 알림 읽음 처리
  - `markAllNotificationsAsRead()` - 모든 알림 읽음 처리
  - `deleteNotification()` - 알림 삭제
  - `getUnreadNotificationCount()` - 읽지 않은 알림 개수 조회

### 11. 신고 (Report)

- `src/api/endpoints/report.ts`
  - `getReportList()` - 신고 목록 조회 (관리자용)
  - `getReport()` - 신고 상세 조회 (관리자용)
  - `createReport()` - 신고 생성
  - `deleteReport()` - 신고 삭제 (관리자용)
  - `getReportsByType()` - 타입별 신고 목록 조회 (관리자용)
  - `getMyReports()` - 내 신고 목록 조회

### 12. 파일 업로드 (Upload)

- `src/api/endpoints/upload.ts`
  - `uploadFile()` - 단일 파일 업로드
  - `uploadFiles()` - 여러 파일 업로드
  - `uploadImage()` - 이미지 업로드
  - `uploadProfileImage()` - 프로필 이미지 업로드
  - `uploadPostImages()` - 게시글 이미지 업로드 (여러 개)

## 통합 Export

- `src/api/endpoints/index.ts` - 모든 API 함수를 한 곳에서 export

## 사용 예시

```tsx
// 단일 import
import { getPostList, createPost } from "@/api/endpoints/post";
import { getReservationList } from "@/api/endpoints/reservation";

// 통합 import (권장)
import {
  getPostList,
  createPost,
  getReservationList,
  createReservation,
  getCategoryList,
  getRegionList,
} from "@/api/endpoints";
```

## 주요 특징

### 1. 타입 안전성

- 모든 함수는 TypeScript 타입으로 정의됨
- 요청/응답 타입이 명확히 지정됨
- DTO 타입을 사용하여 데이터 검증

### 2. 인증 처리

- 인증이 필요한 API는 자동으로 토큰을 헤더에 추가
- `getAuthHeaders()` 메서드를 통해 토큰 관리

### 3. 에러 처리

- 통합 에러 처리 (`ApiError` 타입)
- 에러 응답 구조 표준화

### 4. 파일 업로드

- FormData를 사용하여 파일 업로드
- 이미지 타입 체크
- 프로필 이미지 및 게시글 이미지 별도 처리

### 5. 필터링 및 페이지네이션

- 필터 옵션을 Query Parameter로 전달
- 페이지네이션 응답 타입 (`PaginatedApiResponse`)

## API 엔드포인트 구조

모든 API는 RESTful 원칙을 따릅니다:

```
GET    /api/{resource}          # 목록 조회
GET    /api/{resource}/{id}     # 상세 조회
POST   /api/{resource}          # 생성
PUT    /api/{resource}/{id}     # 수정
DELETE /api/{resource}/{id}     # 삭제
```

## 특수 엔드포인트

- `/api/{resource}/me` - 현재 로그인한 사용자 관련
- `/api/{resource}/favorites` - 즐겨찾기 관련
- `/api/{resource}/tree` - 계층 구조
- `/api/upload` - 파일 업로드
- `/api/upload/profile` - 프로필 이미지 업로드
- `/api/upload/multiple` - 여러 파일 업로드

## 다음 단계

1. ✅ API 엔드포인트 함수 생성 (완료)
2. ⏳ React Query 쿼리 생성 (다음 단계)
3. ⏳ 컴포넌트에서 사용

## 주의사항

- 모든 API 함수는 비동기 함수 (`async/await`)
- 타입 안전성을 위해 제네릭 타입 사용
- 에러 처리는 API 클라이언트에서 통합 처리
- 파일 업로드는 FormData를 사용하여 처리
- 인증 토큰은 자동으로 헤더에 추가됨
