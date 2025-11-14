/**
 * 게시글 즐겨찾기 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type { Post, PostFavorite } from "@/types/domain";

import { buildQueryParams } from "@/lib/utils/api-params";

import { apiClient } from "@/api/client";

/**
 * 즐겨찾기한 게시글 목록 조회
 */
export async function getFavoritePosts(
  filters?: Record<string, unknown>,
): Promise<PaginatedApiResponse<Post>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/posts/favorites${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Post>>(endpoint);
}

/**
 * 게시글 즐겨찾기 추가
 */
export async function addFavorite(postId: number): Promise<PostFavorite> {
  return apiClient.post<PostFavorite>(`/api/v1/posts/${postId}/favorites`, {});
}

/**
 * 게시글 즐겨찾기 제거
 */
export async function removeFavorite(postId: number): Promise<void> {
  return apiClient.delete<void>(`/api/v1/posts/${postId}/favorites`);
}

/**
 * 즐겨찾기 여부 확인
 */
export async function checkFavorite(
  postId: number,
): Promise<{ isFavorite: boolean }> {
  return apiClient.get<{ isFavorite: boolean }>(
    `/api/v1/posts/${postId}/favorites/check`,
  );
}
