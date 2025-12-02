"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { useState } from "react";

import { useAuthStore } from "@/store/authStore";

/**
 * React Query Provider
 * QueryClient를 생성하고 Provider로 감싸는 컴포넌트
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    // Zustand 스토어는 컴포넌트 외부에서도 접근 가능하므로 직접 사용
    const authStore = useAuthStore.getState();

    // 전역 에러 핸들러: 모든 쿼리에서 인증 에러 발생 시 로그아웃 처리
    const queryCache = new QueryCache({
      onError: (error: unknown) => {
        const isBrowser = typeof window !== "undefined";
        if (
          isBrowser &&
          error &&
          typeof error === "object" &&
          "status" in error &&
          typeof error.status === "number" &&
          (error.status === 401 || error.status === 403)
        ) {
          // 백엔드에서 쿠키를 지웠을 때 프론트엔드 인증 상태도 업데이트
          authStore.logout();
        }
      },
    });

    // 전역 에러 핸들러: 모든 뮤테이션에서 인증 에러 발생 시 로그아웃 처리
    const mutationCache = new MutationCache({
      onError: (error: unknown) => {
        const isBrowser = typeof window !== "undefined";
        if (
          isBrowser &&
          error &&
          typeof error === "object" &&
          "status" in error &&
          typeof error.status === "number" &&
          (error.status === 401 || error.status === 403)
        ) {
          // 백엔드에서 쿠키를 지웠을 때 프론트엔드 인증 상태도 업데이트
          authStore.logout();
        }
      },
    });

    return new QueryClient({
      queryCache,
      mutationCache,
      defaultOptions: {
        queries: {
          // 에러가 발생해도 자동으로 재시도하지 않음 (API 실패 시에도 정상 동작)
          retry: false,
          // 데이터가 stale 상태가 되는 시간 (5분)
          staleTime: 1000 * 60 * 5,
          // 캐시된 데이터를 유지하는 시간 (10분)
          gcTime: 1000 * 60 * 10,
          // 윈도우 포커스 시 자동 refetch 비활성화
          refetchOnWindowFocus: false,
          // 에러 발생 시에도 조용히 처리 (앱이 크래시되지 않도록)
          throwOnError: false,
        },
        mutations: {
          // mutation 에러 시 자동 재시도 비활성화
          retry: false,
          // mutation 에러 발생 시에도 조용히 처리
          throwOnError: false,
        },
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
