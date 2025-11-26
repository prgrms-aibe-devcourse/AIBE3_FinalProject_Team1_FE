/**
 * 사용자 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, PaginatedApiResponse } from "@/types/api";
import type { MemberResponse, UpdateMemberDto } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  banUser,
  deleteUser,
  getMe,
  getUser,
  getUserList,
  unbanUser,
  updateUser,
  updateUserByAdmin,
} from "@/api/endpoints/user";

import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

/**
 * 사용자 정보 조회 query
 * @param userId - 사용자 ID (없으면 현재 로그인한 사용자)
 */
export function useUserQuery(userId?: number) {
  const { setUser, logout } = useAuthStore();
  const isBrowser = typeof window !== "undefined";

  return useQuery({
    queryKey: userId
      ? getQueryKey(queryKeys.user.detail(userId))
      : getQueryKey(queryKeys.user.me),
    queryFn: async (): Promise<MemberResponse | null> => {
      try {
        if (userId) {
          return await getUser(userId);
        }
        const user = await getMe();
        // 쿠키 기반 인증: me API 호출 성공 시 사용자 정보를 스토어에 저장
        setUser(user);
        return user;
      } catch (error: unknown) {
        // 네트워크 에러나 CORS 에러는 로그아웃하지 않음
        // 인증 에러(401, 403)만 로그아웃 처리
        if (
          isBrowser &&
          error &&
          typeof error === "object" &&
          "status" in error &&
          typeof error.status === "number" &&
          (error.status === 401 || error.status === 403)
        ) {
          // 명확한 인증 에러인 경우에만 로그아웃
          console.log("[useUserQuery] Authentication failed, logging out");
          logout();
        } else {
          // 네트워크 에러, CORS 에러, 또는 기타 에러는 로그만 남기고 로그아웃하지 않음
          console.error(
            "[useUserQuery] Failed to fetch user (non-auth error):",
            error,
          );
        }
        // API 실패 시 null 반환하여 정상 동작
        return null;
      }
    },
    // 서버 사이드에서는 쿠키가 없으므로 브라우저에서만 실행
    enabled: isBrowser,
    retry: false, // 인증 실패 시 재시도하지 않음
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
  });
}

/**
 * 현재 로그인한 사용자 정보 조회 query
 */
export function useMeQuery() {
  const { setUser, logout } = useAuthStore();
  const isBrowser = typeof window !== "undefined";

  return useQuery({
    queryKey: getQueryKey(queryKeys.user.me),
    queryFn: async (): Promise<MemberResponse | null> => {
      try {
        const user = await getMe();
        // 쿠키 기반 인증: me API 호출 성공 시 사용자 정보를 스토어에 저장
        setUser(user);
        return user;
      } catch (error: unknown) {
        // 네트워크 에러나 CORS 에러는 로그아웃하지 않음
        // 인증 에러(401, 403)만 로그아웃 처리
        if (
          isBrowser &&
          error &&
          typeof error === "object" &&
          "status" in error &&
          typeof error.status === "number" &&
          (error.status === 401 || error.status === 403)
        ) {
          // 명확한 인증 에러인 경우에만 로그아웃
          console.log("[useMeQuery] Authentication failed, logging out");
          logout();
        } else {
          // 네트워크 에러, CORS 에러, 또는 기타 에러는 로그만 남기고 로그아웃하지 않음
          console.error(
            "[useMeQuery] Failed to fetch me (non-auth error):",
            error,
          );
        }
        // API 실패 시 null 반환하여 정상 동작
        return null;
      }
    },
    // 서버 사이드에서는 쿠키가 없으므로 브라우저에서만 실행
    enabled: isBrowser,
    retry: false, // 인증 실패 시 재시도하지 않음
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
  });
}

/**
 * 사용자 목록 조회 query
 * @param filters - 필터 옵션
 */
export function useUserListQuery(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.user.list(filters)),
    queryFn: async (): Promise<MemberResponse[]> => {
      const response = await getUserList(filters);
      // 응답이 배열이면 그대로 반환
      if (Array.isArray(response)) {
        return response;
      }
      // 페이지네이션 응답인 경우 content 필드에서 배열 추출
      if (response && typeof response === "object" && "content" in response) {
        return (response as PaginatedApiResponse<MemberResponse>).content || [];
      }
      return [];
    },
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
  });
}

/**
 * 사용자 정보 업데이트 mutation
 */
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (data: UpdateMemberDto) => updateUser(data),
    onSuccess: (response) => {
      // React Query 캐시에 즉시 업데이트
      queryClient.setQueryData(getQueryKey(queryKeys.user.me), response);
      // 사용자 정보 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.user.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.auth.all),
      });
      // Zustand 스토어 업데이트
      if (user) {
        setUser(response);
      }
      showToast("사용자 정보가 수정되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Update user error:", error);
      const apiError = error as ApiError;
      const errorMessage =
        apiError.message || "사용자 정보 수정에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 사용자 정보 수정 mutation (관리자용)
 */
export function useUpdateUserByAdminMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UpdateMemberDto }) =>
      updateUserByAdmin(userId, data),
    onSuccess: (response, variables) => {
      // 사용자 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.user.detail(variables.userId)),
        response,
      );
      // 사용자 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.user.all),
      });
      showToast("사용자 정보가 수정되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Update user by admin error:", error);
      const apiError = error as ApiError;
      const errorMessage =
        apiError.message || "사용자 정보 수정에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 사용자 삭제 mutation (관리자용)
 */
export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: (_, userId) => {
      // 사용자 상세 쿼리 제거
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.user.detail(userId)),
      });
      // 사용자 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.user.all),
      });
      showToast("사용자가 삭제되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Delete user error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "사용자 삭제에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 사용자 제재 mutation (관리자용)
 */
export function useBanUserMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (userId: number) => banUser(userId),
    onSuccess: (response, userId) => {
      // 사용자 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.user.detail(userId)),
        response,
      );
      // 사용자 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.user.all),
      });
      showToast("사용자가 제재되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Ban user error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "사용자 제재에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 사용자 제재 해제 mutation (관리자용)
 */
export function useUnbanUserMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (userId: number) => unbanUser(userId),
    onSuccess: (response, userId) => {
      // 사용자 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.user.detail(userId)),
        response,
      );
      // 사용자 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.user.all),
      });
      showToast("사용자 제재가 해제되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Unban user error:", error);
      const apiError = error as ApiError;
      const errorMessage =
        apiError.message || "사용자 제재 해제에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}
