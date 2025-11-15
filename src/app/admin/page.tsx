"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { MemberRole } from "@/types/domain";

import { useAuthStore } from "@/store/authStore";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // 관리자만 접근 가능
    if (user && user.role !== MemberRole.ADMIN) {
      router.push("/");
      return;
    }

    // 기본적으로 지역 관리 페이지로 리다이렉트
    if (user?.role === MemberRole.ADMIN) {
      router.push("/admin/regions");
    }
  }, [user, router]);

  return null;
}
