/**
 * Loading 컴포넌트
 */
"use client";

import { useUIStore } from "@/store/uiStore";

export function GlobalLoading() {
  const { isLoading } = useUIStore();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}

