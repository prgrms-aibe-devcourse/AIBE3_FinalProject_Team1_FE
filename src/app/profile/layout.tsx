/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */
"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useMeQuery } from "@/queries/user";

import { Calendar, FileText, User, Heart } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */

/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */

/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */

/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */

/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */

/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */

/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */

/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */

/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */

/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */

/**
 * 프로필 레이아웃
 * 좌측 사이드바와 우측 메인 콘텐츠 구조
 */

type TabType = "profile" | "posts" | "reservations" | "favorites";

type ProfileLayoutProps = {
  children: ReactNode;
};

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { data: me, isLoading: meLoading } = useMeQuery();

  // 스토어에 있는 사용자 정보와 me 응답 중 우선순위: me > user
  // me가 로딩 중이거나 없어도 스토어에 사용자 정보가 있으면 인증 상태로 간주
  const currentUser = me ?? user;

  // 현재 경로에 따라 활성 탭 결정
  const getActiveTab = (): TabType => {
    if (pathname === "/profile") return "profile";
    if (pathname === "/profile/posts") return "posts";
    if (pathname === "/profile/reservations") return "reservations";
    if (pathname === "/profile/favorites") return "favorites";
    return "profile";
  };

  const activeTab = getActiveTab();

  const navItems = [
    {
      id: "profile" as TabType,
      label: "내 정보",
      icon: User,
      path: "/profile",
    },
    {
      id: "posts" as TabType,
      label: "내 게시글",
      icon: FileText,
      path: "/profile/posts",
    },
    {
      id: "reservations" as TabType,
      label: "내 예약",
      icon: Calendar,
      path: "/profile/reservations",
    },
    {
      id: "favorites" as TabType,
      label: "즐겨찾기",
      icon: Heart,
      path: "/profile/favorites",
    },
  ];

  // 클라이언트 사이드에서만 인증 체크 (서버 사이드에서는 항상 레이아웃 렌더링)
  const isBrowser = typeof window !== "undefined";
  const shouldShowLoginScreen = isBrowser && !meLoading && !currentUser && !isAuthenticated;

  // 로그인되지 않은 경우: 마이페이지 대신 로그인 유도 화면
  if (shouldShowLoginScreen) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold mb-3">로그인이 필요합니다</h1>
          <p className="text-sm text-gray-600 mb-6">
            마이페이지를 이용하려면 먼저 로그인해주세요.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex gap-6 py-8">
        {/* 좌측 사이드바 */}
        <aside className="w-64 bg-white border border-gray-200 rounded-lg flex-shrink-0 self-start">
          {/* 프로필 요약 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {currentUser?.profileImgUrl ? (
                  <Image
                    src={currentUser.profileImgUrl}
                    alt={currentUser.nickname || "User"}
                    fill
                    className="object-cover rounded-full"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              {currentUser && (
                <>
                  <p className="font-semibold text-base text-gray-900 text-center">
                    {currentUser.nickname}
                  </p>
                  <p className="text-sm text-gray-500 text-center">
                    {currentUser.email}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 우측 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
