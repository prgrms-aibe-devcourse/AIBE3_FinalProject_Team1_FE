/**
 * OAuth2 소셜 로그인 콜백 페이지
 */
"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { getMe } from "@/api/endpoints/user";
import { getQueryKey, queryKeys } from "@/lib/query-keys";

/**
 * OAuth2 콜백 처리 컴포넌트
 */
function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useUIStore((state) => state.showToast);
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    // OAuth2 인증 후 토큰이 HttpOnly 쿠키로 설정되어 있으므로
    // me API를 직접 호출하여 계정 정보를 가져오고 캐시에 저장
    const handleOAuthCallback = async () => {
      try {
        const user = await getMe();
        // 사용자 정보를 스토어에 저장
        setAuth(user);
        // React Query 캐시에 저장하여 헤더에서 재요청하지 않도록 함
        queryClient.setQueryData(
          getQueryKey(queryKeys.user.me),
          user,
        );
        showToast("로그인되었습니다.", "success");
        // 리다이렉트 파라미터가 있으면 해당 경로로, 없으면 메인 페이지로
        const redirect = searchParams.get("redirect");
        router.push(redirect || "/");
      } catch (error) {
        console.error("Failed to fetch user info after OAuth login:", error);
        showToast("로그인 처리 중 오류가 발생했습니다.", "error");
        router.push("/login");
      }
    };

    handleOAuthCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem-8rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
        <p className="text-lg font-medium text-gray-700">로그인 처리 중...</p>
      </div>
    </div>
  );
}

/**
 * OAuth2 콜백 페이지
 */
export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem-8rem)] items-center justify-center bg-gray-50 px-4 py-12">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
          <p className="text-lg font-medium text-gray-700">로딩 중...</p>
        </div>
      </div>
    }>
      <OAuthCallback />
    </Suspense>
  );
}

