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
  // FormData 확인 (브라우저 환경에서만 FormData가 존재)
  const isFormData =
    typeof FormData !== "undefined" && data instanceof FormData;

  if (process.env.NODE_ENV === "development") {
    console.log("[createPost] IsFormData:", isFormData);
    console.log("[createPost] Data type:", data.constructor?.name);
  }

  return apiClient.post<Post>("/api/v1/posts", data, {
    isFormData,
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

/**
 * 게시글의 예약된 날짜 목록 조회
 */
export async function getReservedDates(postId: number): Promise<string[]> {
  return apiClient.get<string[]>(`/api/v1/posts/${postId}/reserved-dates`);
}

/**
 * 게시글 제재 (관리자용 - 신고 처리)
 */
export async function banPostByAdmin(postId: number): Promise<void> {
  return apiClient.patch<void>(`/api/v1/adm/posts/${postId}/ban`, {});
}

/**
 * 게시글 제재 해제 (관리자용 - 신고 처리)
 */
export async function unbanPostByAdmin(postId: number): Promise<void> {
  return apiClient.patch<void>(`/api/v1/adm/posts/${postId}/unban`, {});
}

/**
 * AI 검색
 */
export async function searchPostsByAI(
  query: string,
): Promise<import("@/types/domain").AISearchResponse> {
  const params = new URLSearchParams({ query });
  const result = await apiClient.get<import("@/types/domain").AISearchResponse>(
    `/api/v1/posts/search/ai?${params.toString()}`,
  );
  if (process.env.NODE_ENV === "development") {
    console.log("[searchPostsByAI] Raw result:", result);
  }
  return result;
}

/**
 * AI 게시글 생성
 */
export async function generatePostDetail(
  imageFiles: File[],
  additionalInfo?: string,
): Promise<import("@/types/domain").GenPostDetailResBody> {
  const formData = new FormData();
  
  // 이미지 파일 추가
  imageFiles.forEach((file) => {
    formData.append("images", file);
  });
  
  // 추가 정보가 있으면 추가
  if (additionalInfo) {
    formData.append("additionalInfo", additionalInfo);
  }
  
  return apiClient.post<import("@/types/domain").GenPostDetailResBody>(
    "/api/v1/posts/genDetail",
    formData,
    {
      isFormData: true,
    },
  );
}