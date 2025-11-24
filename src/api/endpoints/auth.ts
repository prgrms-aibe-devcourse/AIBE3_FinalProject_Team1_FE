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

/**
 * 닉네임 중복 체크
 * 응답: { isDuplicated: boolean }
 */
export interface CheckNicknameResponse {
  isDuplicated: boolean;
}

export async function checkNickname(
  nickname: string,
): Promise<CheckNicknameResponse> {
  const encodedNickname = encodeURIComponent(nickname);
  return apiClient.get<CheckNicknameResponse>(
    `/api/v1/members/check-nickname?nickname=${encodedNickname}`,
  );
}

/**
 * 이메일 인증 코드 발송
 * 응답: { expiresIn: string } (ISO 8601 형식의 만료 시간, UTC)
 */
export interface SendCodeResponse {
  expiresIn: string;
}

export async function sendVerificationCode(
  email: string,
): Promise<SendCodeResponse> {
  return apiClient.post<SendCodeResponse>("/api/v1/members/send-code", {
    email,
  });
}

/**
 * 이메일 인증 코드 검증
 * 응답: { isVerified: boolean }
 */
export interface VerifyCodeResponse {
  isVerified: boolean;
}

export async function verifyCode(
  email: string,
  code: string,
): Promise<VerifyCodeResponse> {
  return apiClient.post<VerifyCodeResponse>("/api/v1/members/verify-code", {
    email,
    code,
  });
}