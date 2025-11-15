/**
 * 회원가입 페이지
 */
"use client";

import { useEffect, useState } from "react";

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
import { MapPin } from "lucide-react";

import { useSignupMutation } from "@/queries/auth";

/**
 * 회원가입 페이지
 */

/**
 * 회원가입 페이지
 */

/**
 * 회원가입 페이지
 */

/**
 * 회원가입 페이지
 */

/**
 * 회원가입 페이지
 */

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

  // 다음 주소 검색 스크립트 로드
  useEffect(() => {
    if (window.daum && window.daum.Postcode) {
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      try {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      } catch {
        // 스크립트가 이미 제거되었을 수 있음
      }
    };
  }, []);

  // 주소 검색 팝업 열기
  const handleOpenAddressSearch = () => {
    if (typeof window === "undefined" || !window.daum) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: daum.PostcodeData) {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
          if (data.bname !== "") {
            extraAddress += data.bname;
          }
          if (data.buildingName !== "") {
            extraAddress +=
              extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
          }
          fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }

        setFormData({
          ...formData,
          address1: fullAddress,
        });
      },
      width: "100%",
      height: "100%",
    }).open({
      q: formData.address1,
      left: window.screen.width / 2 - 300,
      top: window.screen.height / 2 - 300,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signupMutation.mutateAsync(formData);
      // 회원가입 성공 후 로그인 페이지로 이동
      router.push("/login");
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
                도로명 주소 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  id="address1"
                  name="address1"
                  type="text"
                  placeholder="도로명 주소를 검색해주세요"
                  value={formData.address1}
                  onChange={handleChange}
                  required
                  disabled={signupMutation.isPending}
                  className="flex-1"
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenAddressSearch}
                  disabled={signupMutation.isPending}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <MapPin className="h-4 w-4" />
                  주소 검색
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="address2" className="text-sm font-medium">
                상세주소 <span className="text-red-500">*</span>
              </label>
              <Input
                id="address2"
                name="address2"
                type="text"
                placeholder="상세 주소 (예: 123-45, 101호)"
                value={formData.address2}
                onChange={handleChange}
                required
                disabled={signupMutation.isPending}
                className="w-full"
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
