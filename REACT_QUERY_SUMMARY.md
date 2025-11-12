# React Query 쿼리 및 뮤테이션 생성 완료

모든 도메인별 React Query 쿼리와 뮤테이션을 생성했습니다.

## 생성된 파일 목록

### 1. 인증 (Auth)
- `src/queries/auth.ts`
  - `useLoginMutation()` - 로그인
  - `useSignupMutation()` - 회원가입
  - `useLogoutMutation()` - 로그아웃
  - `useAuthQuery()` - 현재 사용자 인증 정보 조회

### 2. 사용자 (User)
- `src/queries/user.ts`
  - `useUserQuery()` - 사용자 정보 조회
  - `useMeQuery()` - 현재 로그인한 사용자 정보 조회
  - `useUserListQuery()` - 사용자 목록 조회
  - `useUpdateUserMutation()` - 사용자 정보 수정
  - `useUpdateUserByAdminMutation()` - 사용자 정보 수정 (관리자용)
  - `useDeleteUserMutation()` - 사용자 삭제 (관리자용)
  - `useBanUserMutation()` - 사용자 제재 (관리자용)
  - `useUnbanUserMutation()` - 사용자 제재 해제 (관리자용)

### 3. 게시글 (Post)
- `src/queries/post.ts`
  - `usePostListQuery()` - 게시글 목록 조회
  - `usePostQuery()` - 게시글 상세 조회
  - `useMyPostsQuery()` - 내 게시글 목록 조회
  - `usePostsByCategoryQuery()` - 카테고리별 게시글 목록 조회
  - `usePostsByRegionQuery()` - 지역별 게시글 목록 조회
  - `useCreatePostMutation()` - 게시글 생성
  - `useUpdatePostMutation()` - 게시글 수정
  - `useDeletePostMutation()` - 게시글 삭제

### 4. 게시글 즐겨찾기 (PostFavorite)
- `src/queries/post-favorite.ts`
  - `useFavoritePostsQuery()` - 즐겨찾기한 게시글 목록 조회
  - `useFavoriteCheckQuery()` - 즐겨찾기 여부 확인
  - `useAddFavoriteMutation()` - 즐겨찾기 추가
  - `useRemoveFavoriteMutation()` - 즐겨찾기 제거

### 5. 예약 (Reservation)
- `src/queries/reservation.ts`
  - `useReservationListQuery()` - 예약 목록 조회
  - `useReservationQuery()` - 예약 상세 조회
  - `useMyReservationsQuery()` - 내 예약 목록 조회
  - `useReservationsByPostQuery()` - 게시글별 예약 목록 조회
  - `useReservationsByStatusQuery()` - 상태별 예약 목록 조회
  - `useCreateReservationMutation()` - 예약 생성
  - `useUpdateReservationMutation()` - 예약 수정
  - `useDeleteReservationMutation()` - 예약 삭제
  - `useApproveReservationMutation()` - 예약 승인
  - `useRejectReservationMutation()` - 예약 거절
  - `useCancelReservationMutation()` - 예약 취소

### 6. 후기 (Review)
- `src/queries/review.ts`
  - `useReviewListQuery()` - 후기 목록 조회
  - `useReviewQuery()` - 후기 상세 조회
  - `useReviewsByPostQuery()` - 게시글별 후기 목록 조회
  - `useReviewByReservationQuery()` - 예약별 후기 조회
  - `useCreateReviewMutation()` - 후기 생성
  - `useUpdateReviewMutation()` - 후기 수정
  - `useDeleteReviewMutation()` - 후기 삭제

### 7. 채팅 (Chat)
- `src/queries/chat.ts`
  - `useChatRoomListQuery()` - 채팅방 목록 조회
  - `useChatRoomQuery()` - 채팅방 상세 조회
  - `useChatRoomByPostQuery()` - 게시글별 채팅방 조회 또는 생성
  - `useChatMessagesQuery()` - 채팅 메시지 목록 조회 (자동 refetch)
  - `useCreateChatMessageMutation()` - 채팅 메시지 생성
  - `useDeleteChatMessageMutation()` - 채팅 메시지 삭제
  - `useDeleteChatRoomMutation()` - 채팅방 삭제
  - `useMarkChatRoomAsReadMutation()` - 채팅방 읽음 처리

### 8. 카테고리 (Category)
- `src/queries/category.ts`
  - `useCategoryListQuery()` - 카테고리 목록 조회
  - `useCategoryQuery()` - 카테고리 상세 조회
  - `useCategoryTreeQuery()` - 카테고리 트리 조회 (계층 구조)
  - `useCreateCategoryMutation()` - 카테고리 생성 (관리자용)
  - `useUpdateCategoryMutation()` - 카테고리 수정 (관리자용)
  - `useDeleteCategoryMutation()` - 카테고리 삭제 (관리자용)

### 9. 지역 (Region)
- `src/queries/region.ts`
  - `useRegionListQuery()` - 지역 목록 조회
  - `useRegionQuery()` - 지역 상세 조회
  - `useRegionTreeQuery()` - 지역 트리 조회 (계층 구조)
  - `useCreateRegionMutation()` - 지역 생성 (관리자용)
  - `useUpdateRegionMutation()` - 지역 수정 (관리자용)
  - `useDeleteRegionMutation()` - 지역 삭제 (관리자용)

### 10. 알림 (Notification)
- `src/queries/notification.ts`
  - `useNotificationListQuery()` - 알림 목록 조회 (자동 refetch)
  - `useUnreadNotificationsQuery()` - 읽지 않은 알림 목록 조회 (자동 refetch)
  - `useNotificationQuery()` - 알림 상세 조회
  - `useUnreadNotificationCountQuery()` - 읽지 않은 알림 개수 조회 (자동 refetch)
  - `useMarkNotificationAsReadMutation()` - 알림 읽음 처리
  - `useMarkAllNotificationsAsReadMutation()` - 모든 알림 읽음 처리
  - `useDeleteNotificationMutation()` - 알림 삭제

### 11. 신고 (Report)
- `src/queries/report.ts`
  - `useReportListQuery()` - 신고 목록 조회 (관리자용)
  - `useReportQuery()` - 신고 상세 조회 (관리자용)
  - `useReportsByTypeQuery()` - 타입별 신고 목록 조회 (관리자용)
  - `useMyReportsQuery()` - 내 신고 목록 조회
  - `useCreateReportMutation()` - 신고 생성
  - `useDeleteReportMutation()` - 신고 삭제 (관리자용)

## 통합 Export

- `src/queries/index.ts` - 모든 쿼리를 한 곳에서 export

## 사용 예시

```tsx
// 통합 import (권장)
import {
  usePostListQuery,
  useCreatePostMutation,
  useReservationListQuery,
  useCreateReservationMutation,
  useCategoryListQuery,
  useRegionListQuery,
} from "@/queries";

// 컴포넌트에서 사용
function PostList() {
  const { data, isLoading, error } = usePostListQuery({
    categoryId: 1,
    page: 1,
    size: 10,
  });

  const createPostMutation = useCreatePostMutation();

  const handleCreate = async () => {
    await createPostMutation.mutateAsync({
      title: "제목",
      content: "내용",
      // ... 기타 필드
    });
  };

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생</div>;

  return (
    <div>
      {data?.data.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

## 주요 특징

### 1. 타입 안전성
- 모든 쿼리와 뮤테이션은 TypeScript로 타입 안전하게 정의됨
- `query-key-factory`를 사용하여 쿼리 키 타입 안전성 보장

### 2. 캐시 관리
- 적절한 `staleTime` 설정으로 불필요한 요청 방지
- `invalidateQueries`를 통한 관련 쿼리 자동 무효화
- `setQueryData`를 통한 낙관적 업데이트

### 3. 실시간 업데이트
- 채팅 메시지: 5초마다 자동 refetch
- 알림: 30초마다 자동 refetch
- `refetchInterval` 옵션 사용

### 4. 에러 처리
- 모든 뮤테이션에 `onError` 핸들러 포함
- 콘솔에 에러 로그 출력

### 5. Zustand 통합
- 인증 관련 쿼리는 Zustand 스토어와 연동
- 사용자 정보 업데이트 시 스토어 자동 업데이트

## StaleTime 설정

- **카테고리/지역**: 30분 (자주 변경되지 않음)
- **게시글/예약/후기**: 2분
- **사용자 정보**: 5분
- **채팅 메시지**: 30초 (실시간)
- **알림**: 30초 (실시간)

## 다음 단계

1. ✅ React Query 쿼리 및 뮤테이션 생성 (완료)
2. ⏳ 컴포넌트 구현
3. ⏳ 에러 바운더리 추가
4. ⏳ 로딩 상태 UI 개선

## 주의사항

- 모든 쿼리는 `enabled` 옵션을 사용하여 조건부 실행
- 뮤테이션 성공 시 관련 쿼리 자동 무효화
- 실시간 데이터는 `refetchInterval` 사용
- 타입 안전성을 위해 `query-key-factory` 사용

