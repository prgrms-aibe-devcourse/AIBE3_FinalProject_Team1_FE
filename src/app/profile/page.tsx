/**
 * 마이페이지 - 내 정보
 */
"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import type { Reservation, UpdateMemberDto } from "@/types/domain";

import { formatNotificationMessage } from "@/lib/utils/notification";

import { parseLocalDateString } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useAuthStore } from "@/store/authStore";

import { useRecentNotificationsQuery } from "@/queries/notification";
import { useMyPostsQuery } from "@/queries/post";
import { useMyReservationsQuery } from "@/queries/reservation";
import { useMeQuery, useUpdateUserMutation } from "@/queries/user";

import {
  Calendar,
  Edit,
  MapPin,
  Pencil,
  Plus,
  Star,
  User,
  X,
} from "lucide-react";

/**
 * 마이페이지 - 내 정보
 */

/**
 * 마이페이지 - 내 정보
 */

/**
 * 마이페이지 - 내 정보
 */

/**
 * 마이페이지 - 내 정보
 */

/**
 * 마이페이지 - 내 정보
 */

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuthStore();
  const { data: me, isLoading: meLoading } = useMeQuery();

  // 스토어에 있는 사용자 정보와 me 응답 중 우선순위: me > authUser
  const meFinal = me ?? authUser;
  const { data: myPosts } = useMyPostsQuery();
  const { data: myReservations } = useMyReservationsQuery();
  const { data: recentNotificationsData } = useRecentNotificationsQuery(5);
  const updateUserMutation = useUpdateUserMutation();

  // 클라이언트 마운트 여부 (Hydration 에러 방지)
  const [isMounted, setIsMounted] = useState(false);

  const [formData, setFormData] = useState({
    name: meFinal?.name || "",
    nickname: meFinal?.nickname || "",
    phoneNumber: meFinal?.phoneNumber || "",
    address1: meFinal?.address1 || "",
    address2: meFinal?.address2 || "",
    removeProfileImage: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );

  // 클라이언트 마운트 후 상태 업데이트
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // meFinal 데이터가 변경되면 formData 업데이트
  useEffect(() => {
    if (meFinal) {
      setFormData({
        name: meFinal.name || "",
        nickname: meFinal.nickname || "",
        phoneNumber: meFinal.phoneNumber || "",
        address1: meFinal.address1 || "",
        address2: meFinal.address2 || "",
        removeProfileImage: false,
      });
      setProfileImagePreview(meFinal.profileImgUrl || null);
      setProfileImageFile(null);
    }
  }, [meFinal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // FormData 생성
    const formDataToSend = new FormData();

    // reqBody를 JSON Blob으로 추가
    const reqBody = {
      address1: formData.address1,
      address2: formData.address2,
      name: formData.name,
      ...(formData.phoneNumber && { phoneNumber: formData.phoneNumber }), // 전화번호가 있을 때만 포함
      removeProfileImage: formData.removeProfileImage,
    };
    formDataToSend.append(
      "reqBody",
      new Blob([JSON.stringify(reqBody)], { type: "application/json" }),
    );

    // 프로필 이미지 파일 추가
    // removeProfileImage가 true면 파일을 보내지 않음 (백엔드에서 삭제 처리)
    // removeProfileImage가 false이고 파일이 있으면 새 이미지 업로드
    if (profileImageFile && !formData.removeProfileImage) {
      formDataToSend.append("profileImage", profileImageFile);
    }
    // removeProfileImage가 true이고 파일이 없으면 백엔드에서 이미지 삭제 처리
    // (reqBody에 removeProfileImage: true가 포함되어 있음)

    // 디버깅용 로그
    if (process.env.NODE_ENV === "development") {
      console.log("프로필 수정 요청:", {
        removeProfileImage: formData.removeProfileImage,
        hasProfileImageFile: !!profileImageFile,
        reqBody,
      });
    }

    try {
      const response = await updateUserMutation.mutateAsync(
        formDataToSend as unknown as UpdateMemberDto,
      );
      // 응답으로 받은 최신 데이터로 formData 업데이트
      if (response) {
        setFormData({
          name: response.name || "",
          nickname: response.nickname || "",
          phoneNumber: response.phoneNumber || "",
          address1: response.address1 || "",
          address2: response.address2 || "",
          removeProfileImage: false,
        });
        setProfileImagePreview(response.profileImgUrl || null);
      }
      setIsEditing(false);
      setProfileImageFile(null);
      // 성공/실패 toast는 useUpdateUserMutation의 onSuccess/onError에서 처리됨
    } catch (error) {
      // 에러는 useUpdateUserMutation의 onError에서 toast로 처리됨
      console.error("Update profile failed:", error);
    }
  };

  const handleCancel = () => {
    if (meFinal) {
      setFormData({
        name: meFinal.name || "",
        nickname: meFinal.nickname || "",
        phoneNumber: meFinal.phoneNumber || "",
        address1: meFinal.address1 || "",
        address2: meFinal.address2 || "",
        removeProfileImage: false,
      });
      setProfileImagePreview(meFinal.profileImgUrl || null);
      setProfileImageFile(null);
    }
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // 이미지를 변경하면 removeProfileImage 체크 해제
      setFormData({
        ...formData,
        removeProfileImage: false,
      });
    }
  };

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
              extraAddress !== ""
                ? `, ${data.buildingName}`
                : data.buildingName;
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

  // 클라이언트 마운트 전에는 항상 메인 콘텐츠 렌더링 (Hydration 에러 방지)
  if (!isMounted) {
    return (
      <div className="space-y-6 p-0">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">내 정보</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="lg:col-span-2">
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 클라이언트에서만 로딩 화면 표시
  if (meLoading && !authUser) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  // 클라이언트에서만 로그인 화면 표시
  // me 로딩이 완료되고, 스토어에도 사용자 정보가 없을 때만 로그인 화면 표시
  if (!meLoading && !meFinal && !isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-500">로그인이 필요합니다.</p>
          <Button onClick={() => router.push("/login")}>로그인</Button>
        </div>
      </div>
    );
  }

  const posts = Array.isArray(myPosts) ? myPosts : myPosts?.content || [];
  const reservations = Array.isArray(myReservations)
    ? myReservations
    : myReservations?.content || [];

  // 완료된 예약 수 계산
  const completedReservations = reservations.filter(
    (r: Reservation) => r.status === "COMPLETED" || r.status === "APPROVED",
  ).length;

  return (
    <div className="space-y-6 p-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">내 정보</h1>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          {isEditing ? "취소" : "정보 수정"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 프로필 카드 및 통계 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 프로필 카드 */}
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6 pt-6 text-center">
              <div className="relative mx-auto mb-4 h-24 w-24 rounded-full bg-gray-200 ring-4 ring-gray-300">
                {/* 항상 원본 이미지만 표시 */}
                {meFinal?.profileImgUrl ? (
                  <Image
                    src={meFinal.profileImgUrl}
                    alt={meFinal?.nickname || "User"}
                    fill
                    className="object-cover rounded-full"
                    key={meFinal.profileImgUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-1 text-gray-900">
                {meFinal?.nickname}
              </h2>
              <p className="text-gray-600 mb-3">{meFinal?.email}</p>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-900">4.8</span>
                <span className="text-gray-600">(24개 리뷰)</span>
              </div>
              <p className="text-sm text-gray-600">
                가입일:{" "}
                {meFinal?.createdAt
                  ? format(
                      parseLocalDateString(meFinal.createdAt),
                      "yyyy. MM. dd.",
                      {
                        locale: ko,
                      },
                    )
                  : ""}
              </p>
            </CardContent>
          </Card>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 pt-4 text-center">
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {posts.length}
                </p>
                <p className="text-sm text-gray-600">등록한 게시글</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 pt-4 text-center">
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {completedReservations}
                </p>
                <p className="text-sm text-gray-600">완료된 예약</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 우측: 기본 정보 및 최근 활동 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 프로필 이미지 */}
                  <div className="flex justify-center">
                    <div className="relative h-24 w-24">
                      <div className="relative h-24 w-24 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-300">
                        {profileImagePreview ? (
                          <Image
                            src={profileImagePreview}
                            alt="프로필 미리보기"
                            fill
                            className="object-cover rounded-full"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <User className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {/* 삭제 버튼 (오른쪽 상단) - 이미지가 있을 때만 표시 */}
                      {profileImagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              removeProfileImage: true,
                            });
                            setProfileImageFile(null);
                            setProfileImagePreview(null);
                          }}
                          disabled={updateUserMutation.isPending}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors disabled:opacity-50 shadow-md z-10"
                          title="프로필 이미지 삭제"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      {/* 파일 선택 버튼 (오른쪽 하단) */}
                      <label
                        htmlFor="profileImage"
                        className="absolute -bottom-1 -right-1 p-2 bg-blue-500 hover:bg-blue-600 rounded-full text-white shadow-md transition-colors disabled:opacity-50 cursor-pointer z-10"
                        title={
                          profileImagePreview
                            ? "프로필 이미지 변경"
                            : "프로필 이미지 추가"
                        }
                      >
                        {profileImagePreview ? (
                          <Pencil className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        <input
                          id="profileImage"
                          name="profileImage"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          disabled={updateUserMutation.isPending}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      이메일
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={meFinal?.email || ""}
                      disabled
                      className="bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="nickname"
                      className="block text-sm font-medium text-gray-700"
                    >
                      닉네임
                    </label>
                    <Input
                      id="nickname"
                      name="nickname"
                      value={formData.nickname}
                      disabled
                      className="bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      이름
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="이름을 입력하세요"
                      disabled={updateUserMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-medium text-gray-700"
                    >
                      전화번호
                    </label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="전화번호를 입력하세요"
                      disabled={updateUserMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="address1"
                      className="block text-sm font-medium text-gray-700"
                    >
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
                        disabled={updateUserMutation.isPending}
                        className="flex-1"
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenAddressSearch}
                        disabled={updateUserMutation.isPending}
                        className="flex items-center gap-2 whitespace-nowrap"
                      >
                        <MapPin className="h-4 w-4" />
                        주소 검색
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="address2"
                      className="block text-sm font-medium text-gray-700"
                    >
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
                      disabled={updateUserMutation.isPending}
                      className="w-full"
                    />
                  </div>
                  {updateUserMutation.isError && (
                    <p className="text-sm text-red-600">
                      프로필 업데이트에 실패했습니다. 다시 시도해주세요.
                    </p>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={updateUserMutation.isPending}
                      className="flex-1"
                    >
                      {updateUserMutation.isPending ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1"
                    >
                      취소
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      이름
                    </label>
                    <p className="text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {meFinal?.name || "없음"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      전화번호
                    </label>
                    <p className="text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {formData.phoneNumber || "없음"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      도로명 주소
                    </label>
                    <p className="text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {formData.address1 || "없음"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      상세주소
                    </label>
                    <p className="text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {formData.address2 || "없음"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 활동 */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-xl">최근 활동</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-6">
              <div className="space-y-4">
                {recentNotificationsData?.content &&
                recentNotificationsData.content.length > 0 ? (
                  recentNotificationsData.content.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {formatNotificationMessage(notification)}
                        </p>
                        {notification.createdAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {format(
                              parseLocalDateString(notification.createdAt),
                              "yyyy. MM. dd. HH:mm",
                              { locale: ko },
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    최근 활동이 없습니다.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
