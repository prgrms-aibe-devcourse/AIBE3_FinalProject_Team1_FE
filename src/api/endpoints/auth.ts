/**
 * 인증 관련 API 엔드포인트
 */
import type { CreateMemberDto, MemberResponse } from "@/types/domain";

import { apiClient } from "@/api/client";

/**
 * 로그인
 * 응답: MemberResponse 객체 (쿠키에 토큰이 자동으로 설정됨)
 */
export async function login(
  email: string,
  password: string,
): Promise<MemberResponse> {
  return apiClient.post<MemberResponse>("/api/v1/members/login", {
    email,
    password,
  });
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  return apiClient.post<void>("/api/v1/members/logout", {});
}

/**
 * 회원가입
 * 응답: MemberResponse 객체
 * 회원가입은 계정만 생성하고, 로그인은 별도로 처리해야 함
 */
export async function signup(data: CreateMemberDto): Promise<MemberResponse> {
  return apiClient.post<MemberResponse>("/api/v1/members", data);
}
