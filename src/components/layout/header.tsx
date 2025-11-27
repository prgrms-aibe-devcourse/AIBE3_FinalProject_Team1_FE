/**
 * Header 컴포넌트
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Calendar,
  MessageCircle,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Settings,
  Bell,
} from "lucide-react";

import { MemberRole } from "@/types/domain";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useChatStore } from "@/store/chatStore";
import { useLogoutMutation } from "@/queries/auth";
import { useMeQuery } from "@/queries/user";

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const { hasUnread } = useNotificationStore();
  const rooms = useChatStore((state) => state.rooms);
  const logoutMutation = useLogoutMutation();

  // 인증된 경우에만 me API 호출 (React Query 캐싱으로 불필요한 재요청 방지)
  // 소셜 로그인 후에는 콜백 페이지에서 이미 호출했으므로 캐시된 데이터 사용
  useMeQuery();

  const totalChatUnread = rooms.reduce(
    (sum, room) => sum + (room.unreadCount ?? 0),
    0,
  );

  console.log("[HEADER] rooms count:", rooms.length, "totalUnread:", totalChatUnread);

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
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === "/chat"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                title="채팅"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="hidden sm:inline">채팅</span>
                {totalChatUnread > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {totalChatUnread}
                  </span>
                )}
              </Link>
              <Link
                href="/notifications"
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === "/notifications"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                title="알림"
              >
                <Bell className="h-5 w-5" />
                <span className="hidden sm:inline">알림</span>
                {hasUnread && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
                )}
              </Link>
              {user?.role === MemberRole.ADMIN && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname?.startsWith("/admin")
                      ? "bg-purple-50 text-purple-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title="관리자"
                >
                  <Settings className="h-5 w-5" />
                  <span className="hidden sm:inline">관리자</span>
                </Link>
              )}
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

