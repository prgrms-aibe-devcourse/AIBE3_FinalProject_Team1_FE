/**
 * Header 컴포넌트
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Calendar, MessageCircle, User, LogOut, LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useLogoutMutation } from "@/queries/auth";

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const logoutMutation = useLogoutMutation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700">
          <Home className="h-6 w-6" />
          <span>취밋</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/posts"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/posts"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title="게시글"
          >
            <FileText className="h-5 w-5" />
            <span className="hidden sm:inline">게시글</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href="/profile/reservations"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname?.startsWith("/profile/reservations")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                title="예약"
              >
                <Calendar className="h-5 w-5" />
                <span className="hidden sm:inline">예약</span>
              </Link>
              <Link
                href="/chat"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === "/chat"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                title="채팅"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="hidden sm:inline">채팅</span>
              </Link>
              <Link
                href="/profile"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname?.startsWith("/profile")
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                title="프로필"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">{user?.nickname || "프로필"}</span>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="flex items-center gap-2"
                title="로그아웃"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">로그인</span>
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">회원가입</span>
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

