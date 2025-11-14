/**
 * 게시글 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type {
  CreatePostDto,
  Post,
  PostListFilters,
  UpdatePostDto,
} from "@/types/domain";

import { buildQueryParams } from "@/lib/utils/api-params";

import { apiClient } from "@/api/client";

/**
 * 게시글 목록 조회
 */
export async function getPostList(
  filters?: PostListFilters,
): Promise<Post[] | PaginatedApiResponse<Post>> {
  const params = buildQueryParams(filters as Record<string, unknown>);
  const endpoint = `/api/v1/posts${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<Post[] | PaginatedApiResponse<Post>>(endpoint);
}

/**
 * 게시글 상세 조회
 */
export async function getPost(postId: number): Promise<Post> {
  return apiClient.get<Post>(`/api/v1/posts/${postId}`);
}

/**
 * 게시글 생성 (FormData 지원)
 */
export async function createPost(
  data: CreatePostDto | FormData,
): Promise<Post> {
  return apiClient.post<Post>("/api/v1/posts", data, {
    isFormData: data instanceof FormData,
  });
}

/**
 * 게시글 수정 (FormData 지원)
 */
export async function updatePost(
  postId: number,
  data: UpdatePostDto | FormData,
): Promise<Post> {
  return apiClient.put<Post>(`/api/v1/posts/${postId}`, data, {
    isFormData: data instanceof FormData,
  });
}

/**
 * 게시글 삭제
 */
export async function deletePost(postId: number): Promise<void> {
  return apiClient.delete<void>(`/api/v1/posts/${postId}`);
}

/**
 * 내 게시글 목록 조회
 */
export async function getMyPosts(
  filters?: PostListFilters,
): Promise<PaginatedApiResponse<Post>> {
  const params = buildQueryParams(filters as Record<string, unknown>);
  const endpoint = `/api/v1/posts/my${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Post>>(endpoint);
}

/**
 * 카테고리별 게시글 목록 조회
 */
export async function getPostsByCategory(
  categoryId: number,
  filters?: PostListFilters,
): Promise<PaginatedApiResponse<Post>> {
  const params = buildQueryParams(filters as Record<string, unknown>);
  const endpoint = `/api/v1/posts/category/${categoryId}${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Post>>(endpoint);
}

/**
 * 지역별 게시글 목록 조회
 */
export async function getPostsByRegion(
  regionId: number,
  filters?: PostListFilters,
): Promise<PaginatedApiResponse<Post>> {
  const params = buildQueryParams(filters as Record<string, unknown>);
  const endpoint = `/api/v1/posts/region/${regionId}${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Post>>(endpoint);
}
