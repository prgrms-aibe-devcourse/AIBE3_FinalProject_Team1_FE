/**
 * 사용자 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type { MemberResponse, UpdateMemberDto } from "@/types/domain";

import { buildQueryParams } from "@/lib/utils/api-params";

import { apiClient } from "@/api/client";

/**
 * 사용자 목록 조회 (관리자용)
 * 페이지네이션 응답은 별도 구조일 수 있음
 */
export async function getUserList(
  filters?: Record<string, unknown>,
): Promise<MemberResponse[] | PaginatedApiResponse<MemberResponse>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/members${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<MemberResponse[] | PaginatedApiResponse<MemberResponse>>(
    endpoint,
  );
}

/**
 * 사용자 상세 조회
 */
export async function getUser(userId: number): Promise<MemberResponse> {
  return apiClient.get<MemberResponse>(`/api/v1/members/${userId}`);
}

/**
 * 현재 로그인한 사용자 정보 조회
 */
export async function getMe(): Promise<MemberResponse> {
  return apiClient.get<MemberResponse>("/api/v1/members/me");
}

/**
 * 사용자 정보 수정 (FormData 지원)
 */
export async function updateUser(
  data: UpdateMemberDto | FormData,
): Promise<MemberResponse> {
  return apiClient.put<MemberResponse>("/api/v1/members/me", data, {
    isFormData: data instanceof FormData,
  });
}

/**
 * 사용자 정보 수정 (관리자용, FormData 지원)
 */
export async function updateUserByAdmin(
  userId: number,
  data: UpdateMemberDto | FormData,
): Promise<MemberResponse> {
  return apiClient.put<MemberResponse>(`/api/v1/members/${userId}`, data, {
    isFormData: data instanceof FormData,
  });
}

/**
 * 사용자 삭제 (관리자용)
 */
export async function deleteUser(userId: number): Promise<void> {
  return apiClient.delete<void>(`/api/v1/members/${userId}`);
}

/**
 * 사용자 제재 (관리자용)
 */
export async function banUser(userId: number): Promise<MemberResponse> {
  return apiClient.put<MemberResponse>(`/api/v1/members/${userId}/ban`, {});
}

/**
 * 사용자 제재 해제 (관리자용)
 */
export async function unbanUser(userId: number): Promise<MemberResponse> {
  return apiClient.put<MemberResponse>(`/api/v1/members/${userId}/unban`, {});
}
