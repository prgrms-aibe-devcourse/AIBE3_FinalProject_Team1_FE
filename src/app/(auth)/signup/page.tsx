/**
 * 회원가입 페이지
 */
"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useSignupMutation } from "@/queries/auth";

/**
 * 회원가입 페이지
 */

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phoneNumber: "",
    address1: "",
    address2: "",
    nickname: "",
  });
  const signupMutation = useSignupMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signupMutation.mutateAsync(formData);
      router.push("/posts");
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem-8rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>새 계정을 만들어 장비를 대여하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                이메일
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={signupMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={signupMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                이름
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={signupMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                닉네임
              </label>
              <Input
                id="nickname"
                name="nickname"
                type="text"
                placeholder="닉네임을 입력하세요"
                value={formData.nickname}
                onChange={handleChange}
                required
                disabled={signupMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-medium">
                전화번호
              </label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="010-1234-5678"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                disabled={signupMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="address1" className="text-sm font-medium">
                도로명 주소
              </label>
              <Input
                id="address1"
                name="address1"
                type="text"
                placeholder="서울시 강남구 테헤란로 123"
                value={formData.address1}
                onChange={handleChange}
                required
                disabled={signupMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="address2" className="text-sm font-medium">
                상세주소
              </label>
              <Input
                id="address2"
                name="address2"
                type="text"
                placeholder="123동 456호"
                value={formData.address2}
                onChange={handleChange}
                required
                disabled={signupMutation.isPending}
              />
            </div>
            {signupMutation.isError && (
              <p className="text-sm text-red-600">
                회원가입에 실패했습니다. 입력 정보를 확인해주세요.
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? "가입 중..." : "회원가입"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
