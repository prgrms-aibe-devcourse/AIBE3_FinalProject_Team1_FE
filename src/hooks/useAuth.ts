/**
 * 인증 관련 커스텀 훅 예시
 */

import { useState, useEffect } from "react";

/**
 * 인증 상태 관리 훅
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 확인 로직
    // 예: 토큰 확인, 세션 확인 등
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    setIsAuthenticated,
  };
}

