/**
 * 마이페이지 - 내 정보
 */
"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import type { Reservation } from "@/types/domain";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useMyPostsQuery } from "@/queries/post";
import { useMyReservationsQuery } from "@/queries/reservation";
import { useMeQuery, useUpdateUserMutation } from "@/queries/user";

import { Calendar, Edit, Star } from "lucide-react";

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

/**
 * 마이페이지 - 내 정보
 */

export default function ProfilePage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useMeQuery();
  const { data: myPosts } = useMyPostsQuery();
  const { data: myReservations } = useMyReservationsQuery();
  const updateUserMutation = useUpdateUserMutation();

  const [formData, setFormData] = useState({
    name: me?.name || "",
    nickname: me?.nickname || "",
    phoneNumber: me?.phoneNumber || "",
    address1: me?.address1 || "",
    address2: me?.address2 || "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // me 데이터가 변경되면 formData 업데이트
  useEffect(() => {
    if (me) {
      setFormData({
        name: me.name || "",
        nickname: me.nickname || "",
        phoneNumber: me.phoneNumber || "",
        address1: me.address1 || "",
        address2: me.address2 || "",
      });
    }
  }, [me]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserMutation.mutateAsync(formData);
      setIsEditing(false);
      alert("프로필이 업데이트되었습니다.");
    } catch (error) {
      console.error("Update profile failed:", error);
    }
  };

  const handleCancel = () => {
    if (me) {
      setFormData({
        name: me.name || "",
        nickname: me.nickname || "",
        phoneNumber: me.phoneNumber || "",
        address1: me.address1 || "",
        address2: me.address2 || "",
      });
    }
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (meLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!me) {
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
          <Card className="bg-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="relative mx-auto mb-4 h-24 w-24 rounded-full bg-white/20 ring-4 ring-white/30">
                {me.profileImgUrl ? (
                  <Image
                    src={me.profileImgUrl}
                    alt={me.nickname}
                    fill
                    className="object-cover rounded-full"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl font-semibold text-white">
                    {me.nickname?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-1">{me.nickname}</h2>
              <p className="text-blue-100 mb-3">{me.email}</p>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">4.8</span>
                <span className="text-blue-100">(24개 리뷰)</span>
              </div>
              <p className="text-sm text-blue-100">
                가입일:{" "}
                {format(new Date(me.createdAt), "yyyy. MM. dd.", {
                  locale: ko,
                })}
              </p>
            </CardContent>
          </Card>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {posts.length}
                </p>
                <p className="text-sm text-gray-600">등록한 게시글</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
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
            <CardContent className="p-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      required
                      disabled={updateUserMutation.isPending}
                    />
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
                      value={me.email}
                      disabled
                      className="bg-gray-50"
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
                      required
                      disabled={updateUserMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700"
                    >
                      주소
                    </label>
                    <Input
                      id="address"
                      value={`${formData.address1} ${formData.address2}`.trim()}
                      disabled
                      className="bg-gray-50"
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
                      {formData.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      이메일
                    </label>
                    <p className="text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {me.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      전화번호
                    </label>
                    <p className="text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {formData.phoneNumber}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      주소
                    </label>
                    <p className="text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {`${formData.address1} ${formData.address2}`.trim() ||
                        "주소 없음"}
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
            <CardContent className="p-6">
              <div className="space-y-4">
                {reservations.slice(0, 3).map((reservation: Reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        새로운 예약 신청
                      </p>
                      <p className="text-sm text-gray-600">
                        예약 #{reservation.id}에 대한 예약 신청이 있습니다.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(
                          new Date(reservation.createdAt),
                          "yyyy. MM. dd. HH:mm",
                          { locale: ko },
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                {reservations.length === 0 && (
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
