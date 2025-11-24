"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { MapPin, Tag, Flag } from "lucide-react";

import { MemberRole } from "@/types/domain";

import { useAuthStore } from "@/store/authStore";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // 로그인하지 않았으면 로그인 페이지로 이동
    if (!user) {
      router.push("/login");
      return;
    }
    // 로그인은 했지만 관리자가 아니면 홈으로
    if (user.role !== MemberRole.ADMIN) {
      router.push("/");
    }
  }, [user, router]);

  // 관리자가 아니면 아무것도 렌더링하지 않음
  if (!user || user.role !== MemberRole.ADMIN) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">관리자 페이지</h1>
      </div>

      {/* 네비게이션 탭 */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          <Link
            href="/admin/regions"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              pathname === "/admin/regions"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <MapPin className="h-4 w-4" />
            지역 관리
          </Link>
          <Link
            href="/admin/categories"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              pathname === "/admin/categories"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Tag className="h-4 w-4" />
            카테고리 관리
          </Link>
          <Link
            href="/admin/reports"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              pathname === "/admin/reports"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Flag className="h-4 w-4" />
            신고 관리
          </Link>
        </nav>
      </div>

      {/* 컨텐츠 */}
      {children}
    </div>
  );
}
