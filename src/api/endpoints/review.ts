/**
 * 후기 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type { CreateReviewDto, Review, UpdateReviewDto } from "@/types/domain";

import { buildQueryParams } from "@/lib/utils/api-params";

import { apiClient } from "@/api/client";

/**
 * 후기 목록 조회
 */
export async function getReviewList(
  filters?: Record<string, unknown>,
): Promise<PaginatedApiResponse<Review>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/reviews${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Review>>(endpoint);
}

/**
 * 후기 상세 조회
 */
export async function getReview(reviewId: number): Promise<Review> {
  return apiClient.get<Review>(`/api/v1/reviews/${reviewId}`);
}

/**
 * 후기 생성
 * 백엔드 스펙: POST /api/v1/reviews/{reservationId}
 */
export async function createReview(data: CreateReviewDto): Promise<Review> {
  const { reservationId, ...body } = data;
  return apiClient.post<Review>(`/api/v1/reviews/${reservationId}`, body);
}

/**
 * 후기 수정
 */
export async function updateReview(
  reviewId: number,
  data: UpdateReviewDto,
): Promise<Review> {
  return apiClient.put<Review>(`/api/v1/reviews/${reviewId}`, data);
}

/**
 * 후기 삭제
 */
export async function deleteReview(reviewId: number): Promise<void> {
  return apiClient.delete<void>(`/api/v1/reviews/${reviewId}`);
}

/**
 * 게시글별 후기 목록 조회
 */
export async function getReviewsByPost(
  postId: number,
  filters?: Record<string, unknown>,
): Promise<PaginatedApiResponse<Review>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/posts/${postId}/reviews${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Review>>(endpoint);
}

/**
 * 회원별 후기 목록 조회
 * GET /api/v1/members/{memberId}/reviews
 */
export async function getReviewsByMember(
  memberId: number,
  filters?: Record<string, unknown>,
): Promise<PaginatedApiResponse<Review>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/members/${memberId}/reviews${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Review>>(endpoint);
}

/**
 * 예약별 후기 조회
 */
export async function getReviewByReservation(
  reservationId: number,
): Promise<Review | null> {
  return apiClient.get<Review | null>(
    `/api/v1/reservations/${reservationId}/review`,
  );
}

/**
 * 리뷰 제재 (관리자용 - 신고 처리)
 */
export async function banReviewByAdmin(reviewId: number): Promise<void> {
  return apiClient.patch<void>(`/api/v1/adm/reviews/${reviewId}/ban`, {});
}

/**
 * 리뷰 제재 해제 (관리자용 - 신고 처리)
 */
export async function unbanReviewByAdmin(reviewId: number): Promise<void> {
  return apiClient.patch<void>(`/api/v1/adm/reviews/${reviewId}/unban`, {});
}
