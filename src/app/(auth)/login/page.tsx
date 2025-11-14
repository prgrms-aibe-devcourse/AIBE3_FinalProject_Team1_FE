/**
 * 로그인 페이지
 */
"use client";

import { useState, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useLoginMutation } from "@/queries/auth";

/**
 * 로그인 페이지
 */

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({ email, password });
      // 리다이렉트 파라미터가 있으면 해당 경로로, 없으면 /posts로
      const redirect = searchParams.get("redirect");
      router.push(redirect || "/posts");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem-8rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>계정에 로그인하여 장비를 대여하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loginMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loginMutation.isPending}
              />
            </div>
            {loginMutation.isError && (
              <p className="text-sm text-red-600">
                로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
