/**
 * 게시글 즐겨찾기 관련 API 엔드포인트
 */
import type { ApiResponse, PaginatedApiResponse } from "@/types/api";
import type { Post, PostFavorite } from "@/types/domain";

import { buildQueryParams } from "@/lib/utils/api-params";

import { apiClient } from "@/api/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

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
 * 게시글 즐겨찾기 토글 (등록/해제)
 * POST 요청으로 토글 방식 동작
 * 응답: { status, msg, data: boolean }
 */
export async function toggleFavorite(
  postId: number,
): Promise<ApiResponse<boolean>> {
  const url = `${API_BASE_URL}/api/v1/posts/favorites/${postId}`;
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw {
      message: error.msg || error.message || "즐겨찾기 토글에 실패했습니다.",
      status: response.status,
      errors: error.errors,
    };
  }

  return (await response.json()) as ApiResponse<boolean>;
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
