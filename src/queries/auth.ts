/**
 * 인증 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/types/api";
import type { CreateMemberDto, MemberResponse } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import { useUIStore } from "@/store/uiStore";

import { login, logout as logoutApi, signup } from "@/api/endpoints/auth";
import { getMe } from "@/api/endpoints/user";

import { useAuthStore } from "@/store/authStore";

/**
 * 로그인 mutation
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: async (user) => {
      // 쿠키 기반 인증: 토큰은 HttpOnly 쿠키로 자동 설정됨
      // 응답은 MemberResponse 객체 자체
      setAuth(user);

      // 로그인 시 받은 사용자 정보를 me 쿼리 캐시에 직접 설정
      // 이렇게 하면 별도 API 호출 없이 캐시에서 데이터를 사용할 수 있음
      queryClient.setQueryData(
        getQueryKey(queryKeys.user.me),
        user,
      );

      // 로그인 성공 후 me API를 호출하여 쿠키가 제대로 설정되었는지 확인
      try {
        const me = await getMe();
        setAuth(me); // 최신 사용자 정보로 업데이트
        // me API 응답으로 캐시 업데이트
        queryClient.setQueryData(
          getQueryKey(queryKeys.user.me),
          me,
        );
      } catch (error) {
        console.error("Failed to fetch user info after login:", error);
        // 쿠키가 제대로 설정되지 않았을 수 있지만, 로그인 응답의 사용자 정보는 있으므로 계속 진행
      }

      // 인증 및 사용자 정보 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.auth.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.user.all),
      });
      showToast("로그인되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Login error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "로그인에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 회원가입 mutation
 * 회원가입은 계정 생성만 하고, 로그인은 별도로 처리해야 함
 */
export function useSignupMutation() {
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (data: CreateMemberDto) => signup(data),
    onSuccess: () => {
      // 회원가입 성공: 계정만 생성되고 로그인은 되지 않음
      // 사용자는 별도로 로그인해야 함
      showToast("회원가입이 완료되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Signup error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "회원가입에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 로그아웃 mutation
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      // Zustand 스토어에서 인증 정보 제거
      logout();
      // 모든 쿼리 캐시 클리어
      queryClient.clear();
      showToast("로그아웃되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Logout error:", error);
      // 에러가 발생해도 로그아웃 처리
      logout();
      queryClient.clear();
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "로그아웃에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 현재 사용자 인증 정보 조회 query
 */
export function useAuthQuery() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: getQueryKey(queryKeys.auth.me),
    queryFn: async (): Promise<{ user: MemberResponse } | null> => {
      if (!user) {
        return null;
      }
      // 쿠키 기반 인증: 토큰은 HttpOnly 쿠키로 관리됨
      // 스토어의 사용자 정보만 반환
      return {
        user,
      };
    },
    enabled: !!user, // 사용자 정보가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
  });
}
