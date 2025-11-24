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

import type { ApiError } from "@/types/api";

import {
  checkNickname,
  sendVerificationCode,
  verifyCode,
} from "@/api/endpoints/auth";
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
  const [nicknameError, setNicknameError] = useState<string>("");
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isNicknameDuplicated, setIsNicknameDuplicated] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [codeError, setCodeError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0); // 초 단위
  const [isCodeSent, setIsCodeSent] = useState(false); // 인증 코드 발송 성공 여부
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

  // 인증 코드 타이머
  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

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

  // 이메일 인증 코드 발송
  const handleSendVerificationCode = async () => {
    if (!formData.email || !formData.email.trim()) {
      setEmailError("이메일을 입력해주세요.");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setIsSendingCode(true);
    setEmailError("");
    setIsEmailVerified(false);
    setVerificationCode("");
    setCodeError("");
    setIsCodeSent(false);

    try {
      const response = await sendVerificationCode(formData.email);
      // 서버에서 받은 만료 시간을 사용하여 남은 시간 계산
      // expiresIn은 ISO 8601 형식 (예: "2025-11-24T12:58:44.2073647")
      // 서버에서 로컬 시간(KST)을 보내므로, 'Z'를 추가하지 않고 그대로 파싱
      // new Date()는 시간대 정보가 없으면 로컬 시간으로 해석함
      
      const expiresAt = new Date(response.expiresIn);
      const now = new Date();
      
      // getTime()은 UTC 밀리초를 반환하므로, 
      // 로컬 시간으로 해석된 두 시간의 차이를 정확히 계산할 수 있음
      const millisecondsLeft = expiresAt.getTime() - now.getTime();
      const secondsLeft = Math.max(0, Math.floor(millisecondsLeft / 1000));
      
      setTimeLeft(secondsLeft);
      setIsCodeSent(true); // 발송 성공 플래그 설정
      setEmailError("");
    } catch (error) {
      console.error("인증 코드 발송 실패:", error);
      const apiError = error as ApiError;
      setEmailError(apiError.message || "인증 코드 발송에 실패했습니다.");
      setIsCodeSent(false);
    } finally {
      setIsSendingCode(false);
    }
  };

  // 인증 코드 검증
  const handleVerifyCode = async () => {
    if (!verificationCode || !verificationCode.trim()) {
      setCodeError("인증 코드를 입력해주세요.");
      return;
    }

    if (timeLeft <= 0) {
      setCodeError("인증 시간이 만료되었습니다. 다시 발송해주세요.");
      return;
    }

    setIsVerifyingCode(true);
    setCodeError("");

    try {
      const response = await verifyCode(formData.email, verificationCode);
      if (response.isVerified) {
        setIsEmailVerified(true);
        setCodeError("");
        setTimeLeft(0);
      } else {
        setCodeError("인증 코드가 일치하지 않습니다.");
        setIsEmailVerified(false);
      }
    } catch (error) {
      console.error("인증 코드 검증 실패:", error);
      const apiError = error as ApiError;

      // 상태 코드에 따라 다른 메시지 표시
      if (apiError.status === 400) {
        setCodeError("인증코드가 일치하지 않습니다.");
      } else if (apiError.status === 410) {
        setCodeError("인증코드가 만료되었거나 존재하지 않습니다.");
        setTimeLeft(0); // 타이머 초기화
      } else {
        setCodeError(apiError.message || "인증 코드 검증에 실패했습니다.");
      }
      setIsEmailVerified(false);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // 닉네임 중복 체크 버튼 클릭 핸들러
  const handleCheckNickname = async () => {
    if (!formData.nickname || formData.nickname.trim().length === 0) {
      setNicknameError("닉네임을 입력해주세요.");
      return;
    }

    setIsCheckingNickname(true);
    setNicknameError("");
    setIsNicknameChecked(false);
    setIsNicknameDuplicated(false);

    try {
      const response = await checkNickname(formData.nickname);
      if (response.isDuplicated) {
        setNicknameError("이미 사용 중인 닉네임입니다.");
        setIsNicknameDuplicated(true);
        setIsNicknameChecked(true);
      } else {
        setNicknameError("");
        setIsNicknameDuplicated(false);
        setIsNicknameChecked(true);
      }
    } catch (error) {
      console.error("닉네임 중복 체크 실패:", error);
      setNicknameError("닉네임 중복 확인에 실패했습니다.");
      setIsNicknameDuplicated(true);
      setIsNicknameChecked(false);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이메일 인증 확인
    if (!isEmailVerified) {
      setEmailError("이메일 인증을 완료해주세요.");
      return;
    }

    // 닉네임이 입력되었지만 체크하지 않은 경우
    if (formData.nickname && !isNicknameChecked) {
      setNicknameError("닉네임 중복 확인을 해주세요.");
      return;
    }

    // 닉네임이 중복된 경우 회원가입 방지
    if (isNicknameDuplicated) {
      setNicknameError("이미 사용 중인 닉네임입니다.");
      return;
    }

    try {
      await signupMutation.mutateAsync(formData);
      // 회원가입 성공 후 로그인 페이지로 이동
      router.push("/login");
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // 닉네임 필드가 변경되면 체크 상태 초기화
    if (name === "nickname") {
      setIsNicknameChecked(false);
      setNicknameError("");
      setIsNicknameDuplicated(false);
    }

    // 이메일 필드가 변경되면 인증 상태 초기화
    if (name === "email") {
      setIsEmailVerified(false);
      setEmailError("");
      setVerificationCode("");
      setCodeError("");
      setTimeLeft(0);
      setIsCodeSent(false);
    }
  };

  // 인증 코드 입력 핸들러
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
    setCodeError("");
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
              <div className="flex gap-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={signupMutation.isPending || isEmailVerified}
                  error={!!emailError}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendVerificationCode}
                  disabled={
                    signupMutation.isPending ||
                    isSendingCode ||
                    isEmailVerified ||
                    !formData.email.trim()
                  }
                  className="whitespace-nowrap"
                >
                  {isSendingCode ? "발송 중..." : "인증 코드 발송"}
                </Button>
              </div>
              {emailError && (
                <p className="text-sm text-red-600">{emailError}</p>
              )}
              {isEmailVerified && (
                <p className="text-sm text-green-600">이메일 인증이 완료되었습니다.</p>
              )}
            </div>
            {isCodeSent && !isEmailVerified && (
              <div className="space-y-2">
                <label htmlFor="verificationCode" className="text-sm font-medium">
                  인증 코드
                </label>
                <div className="flex gap-2">
                  <Input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    placeholder="인증 코드를 입력하세요"
                    value={verificationCode}
                    onChange={handleCodeChange}
                    disabled={signupMutation.isPending || isVerifyingCode}
                    error={!!codeError}
                    className="flex-1"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVerifyCode}
                    disabled={
                      signupMutation.isPending ||
                      isVerifyingCode ||
                      !verificationCode.trim() ||
                      timeLeft <= 0
                    }
                    className="whitespace-nowrap"
                  >
                    {isVerifyingCode ? "확인 중..." : "인증 확인"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  {codeError && (
                    <p className="text-sm text-red-600">{codeError}</p>
                  )}
                  {timeLeft > 0 ? (
                    <p className="text-sm text-gray-500 ml-auto">
                      남은 시간: {Math.floor(timeLeft / 60)}:
                      {String(timeLeft % 60).padStart(2, "0")}
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 ml-auto">
                      인증 시간이 만료되었습니다. 다시 발송해주세요.
                    </p>
                  )}
                </div>
              </div>
            )}
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
              <label htmlFor="nickname" className="text-sm font-medium">
                닉네임
              </label>
              <div className="flex gap-2">
                <Input
                  id="nickname"
                  name="nickname"
                  type="text"
                  placeholder="닉네임을 입력하세요"
                  value={formData.nickname}
                  onChange={handleChange}
                  required
                  disabled={signupMutation.isPending || isCheckingNickname}
                  error={!!nicknameError}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckNickname}
                  disabled={
                    signupMutation.isPending ||
                    isCheckingNickname ||
                    !formData.nickname.trim()
                  }
                  className="whitespace-nowrap"
                >
                  {isCheckingNickname ? "확인 중..." : "닉네임 체크"}
                </Button>
              </div>
              {isCheckingNickname && (
                <p className="text-sm text-gray-500">닉네임 확인 중...</p>
              )}
              {nicknameError && (
                <p className="text-sm text-red-600">{nicknameError}</p>
              )}
              {!isCheckingNickname &&
                !nicknameError &&
                isNicknameChecked &&
                !isNicknameDuplicated && (
                  <p className="text-sm text-green-600">
                    사용 가능한 닉네임입니다.
                  </p>
                )}
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
              disabled={
                signupMutation.isPending ||
                !isEmailVerified ||
                isNicknameDuplicated ||
                isCheckingNickname ||
                (formData.nickname && !isNicknameChecked)
              }
            >
              {signupMutation.isPending ? "가입 중..." : "회원가입"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
