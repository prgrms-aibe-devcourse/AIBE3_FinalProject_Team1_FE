/**
 * 인증 상태 관리 스토어
 * Zustand를 사용한 전역 상태 관리
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { MemberResponse } from "@/types/domain";

interface AuthState {
  user: MemberResponse | null;
  isAuthenticated: boolean;
  setUser: (user: MemberResponse | null) => void;
  setAuth: (user: MemberResponse) => void;
  logout: () => void;
}

/**
 * 인증 스토어
 * persist middleware를 사용하여 localStorage에 토큰과 사용자 정보를 저장
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      setAuth: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
