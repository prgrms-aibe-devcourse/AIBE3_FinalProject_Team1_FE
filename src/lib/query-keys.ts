/**
 * React Query 키 관리
 * @lukemorales/query-key-factory를 사용하여 타입 안전한 쿼리 키 관리
 * ERD 기반 쿼리 키 정의
 */
import {
  createQueryKeys,
  mergeQueryKeys,
} from "@lukemorales/query-key-factory";

/**
 * 인증 관련 쿼리 키
 */
export const authKeys = createQueryKeys("auth", {
  all: null,
  detail: (token: string) => [token],
  me: null,
});

/**
 * 사용자 관련 쿼리 키
 */
export const userKeys = createQueryKeys("user", {
  all: null,
  detail: (userId: number) => [userId],
  me: null,
  list: (filters?: Record<string, unknown>) => [filters ?? {}],
});

/**
 * 게시글 관련 쿼리 키
 */
export const postKeys = createQueryKeys("post", {
  all: null,
  detail: (postId: number) => [postId],
  list: (filters?: Record<string, unknown>) => [filters ?? {}],
  favorites: null,
  myPosts: null,
  byCategory: (categoryId: number) => [categoryId],
  byRegion: (regionId: number) => [regionId],
});

/**
 * 예약 관련 쿼리 키
 */
export const reservationKeys = createQueryKeys("reservation", {
  all: null,
  detail: (reservationId: number) => [reservationId],
  list: (filters?: Record<string, unknown>) => [filters ?? {}],
  myReservations: null,
  byPost: (postId: number) => [postId],
  byStatus: (status: string) => [status],
});

/**
 * 후기 관련 쿼리 키
 */
export const reviewKeys = createQueryKeys("review", {
  all: null,
  detail: (reviewId: number) => [reviewId],
  byPost: (postId: number) => [postId],
  byReservation: (reservationId: number) => [reservationId],
});

/**
 * 채팅 관련 쿼리 키
 */
export const chatKeys = createQueryKeys("chat", {
  all: null,
  rooms: null,
  room: (roomId: number) => [roomId],
  messages: (roomId: number) => [roomId],
  byPost: (postId: number) => [postId],
});

/**
 * 카테고리 관련 쿼리 키
 */
export const categoryKeys = createQueryKeys("category", {
  all: null,
  detail: (categoryId: number) => [categoryId],
  tree: null, // 계층 구조
});

/**
 * 지역 관련 쿼리 키
 */
export const regionKeys = createQueryKeys("region", {
  all: null,
  detail: (regionId: number) => [regionId],
  tree: null, // 계층 구조
});

/**
 * 알림 관련 쿼리 키
 */
export const notificationKeys = createQueryKeys("notification", {
  all: null,
  unread: null,
  detail: (notificationId: number) => [notificationId],
});

/**
 * 신고 관련 쿼리 키
 */
export const reportKeys = createQueryKeys("report", {
  all: null,
  detail: (reportId: number) => [reportId],
  list: (filters?: Record<string, unknown>) => [filters ?? {}],
});

/**
 * 모든 쿼리 키를 하나의 객체로 통합
 */
export const queryKeys = mergeQueryKeys(
  authKeys,
  userKeys,
  postKeys,
  reservationKeys,
  reviewKeys,
  chatKeys,
  categoryKeys,
  regionKeys,
  notificationKeys,
  reportKeys,
);

/**
 * 쿼리 키만 추출하는 헬퍼 함수
 * query-key-factory가 반환하는 QueryOptionsStruct에서 queryKey 속성 추출
 */
export function getQueryKey(key: {
  queryKey: readonly unknown[];
}): readonly unknown[] {
  return key.queryKey;
}
