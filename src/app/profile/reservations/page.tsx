/**
 * 마이페이지 - 내 예약
 */
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Star, X } from "lucide-react";

import type { Reservation } from "@/types/domain";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { getImageUrl } from "@/lib/utils/image";

import {
  useMyReservationsQuery,
  useCancelReservationMutation,
} from "@/queries/reservation";
import { useUIStore } from "@/store/uiStore";

type StatusFilter =
  | "all"
  | "PENDING_APPROVAL"
  | "PENDING_PAYMENT"
  | "PENDING_PICKUP"
  | "RENTING"
  | "RETURN_COMPLETED"
  | "REFUND_COMPLETED"
  | "LOST_OR_UNRETURNED"
  | "CLAIMING"
  | "CLAIM_COMPLETED"
  | "REJECTED"
  | "CANCELLED";

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: "승인 대기",
  PENDING_PAYMENT: "결제 대기",
  PENDING_PICKUP: "수령 대기",
  SHIPPING: "배송 중",
  INSPECTING_RENTAL: "대여 검수",
  RENTING: "대여중",
  PENDING_RETURN: "반납 대기",
  RETURNING: "반납 중",
  RETURN_COMPLETED: "반납 완료",
  INSPECTING_RETURN: "반납 검수",
  PENDING_REFUND: "환급 예정",
  REFUND_COMPLETED: "환급 완료",
  LOST_OR_UNRETURNED: "미반납/분실",
  CLAIMING: "청구 진행",
  CLAIM_COMPLETED: "청구 완료",
  REJECTED: "승인 거절",
  CANCELLED: "예약 취소",
};

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: "bg-orange-100 text-orange-800",
  PENDING_PAYMENT: "bg-orange-100 text-orange-800",
  PENDING_PICKUP: "bg-yellow-100 text-yellow-800",
  SHIPPING: "bg-blue-100 text-blue-800",
  INSPECTING_RENTAL: "bg-purple-100 text-purple-800",
  RENTING: "bg-green-100 text-green-800",
  PENDING_RETURN: "bg-yellow-100 text-yellow-800",
  RETURNING: "bg-blue-100 text-blue-800",
  RETURN_COMPLETED: "bg-green-100 text-green-800",
  INSPECTING_RETURN: "bg-purple-100 text-purple-800",
  PENDING_REFUND: "bg-blue-100 text-blue-800",
  REFUND_COMPLETED: "bg-green-100 text-green-800",
  LOST_OR_UNRETURNED: "bg-red-100 text-red-800",
  CLAIMING: "bg-orange-100 text-orange-800",
  CLAIM_COMPLETED: "bg-gray-100 text-gray-800",
  REJECTED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const statusTabs: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "전체" },
  { key: "PENDING_APPROVAL", label: "승인 대기" },
  { key: "PENDING_PAYMENT", label: "결제 대기" },
  { key: "PENDING_PICKUP", label: "수령 대기" },
  { key: "RENTING", label: "대여중" },
  { key: "RETURN_COMPLETED", label: "반납 완료" },
  { key: "REFUND_COMPLETED", label: "환급 완료" },
  { key: "LOST_OR_UNRETURNED", label: "미반납/분실" },
  { key: "CLAIMING", label: "청구 진행" },
  { key: "CLAIM_COMPLETED", label: "청구 완료" },
  { key: "REJECTED", label: "승인 거절" },
  { key: "CANCELLED", label: "예약 취소" },
];

export default function MyReservationsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const showToast = useUIStore((state) => state.showToast);
  const cancelMutation = useCancelReservationMutation();

  const { data: myReservations, isLoading: reservationsLoading } =
    useMyReservationsQuery({
      page: page - 1,
      size: pageSize,
      ...(statusFilter !== "all" && { status: statusFilter }),
    });

  const reservations = useMemo(() => {
    if (!myReservations) return [];
    return Array.isArray(myReservations)
      ? myReservations
      : myReservations?.content || [];
  }, [myReservations]);

  const totalPages = useMemo(() => {
    if (!myReservations || Array.isArray(myReservations)) return 1;
    return myReservations.page?.totalPages || 1;
  }, [myReservations]);

  const totalElements = useMemo(() => {
    if (!myReservations || Array.isArray(myReservations)) {
      return Array.isArray(myReservations) ? myReservations.length : 0;
    }
    return myReservations.page?.totalElements || 0;
  }, [myReservations]);

  // 상태별 개수 계산 (실제로는 서버에서 받아야 함)
  const statusCounts = useMemo(() => {
    if (!myReservations || Array.isArray(myReservations)) {
      return {} as Record<StatusFilter, number>;
    }
    // 현재는 전체 개수만 표시
    // 실제로는 서버에서 상태별 개수를 받아야 함
    const counts: Partial<Record<StatusFilter, number>> = {
      all: totalElements,
    };
    // 예약 목록에서 상태별 개수 계산
    if (Array.isArray(reservations)) {
      statusTabs.forEach((tab) => {
        if (tab.key !== "all") {
          counts[tab.key] = reservations.filter(
            (r) => r.status === tab.key,
          ).length;
        }
      });
    }
    return counts;
  }, [myReservations, totalElements, reservations]);

  const handleCancel = async (reservationId: number) => {
    const reason = prompt("취소 사유를 입력해주세요:");
    if (!reason || !reason.trim()) {
      showToast("취소 사유를 입력해주세요.", "error");
      return;
    }
    try {
      await cancelMutation.mutateAsync({
        reservationId,
        reason,
      });
      showToast("예약이 취소되었습니다.", "success");
    } catch (error) {
      console.error("Failed to cancel reservation:", error);
    }
  };

  if (reservationsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="h-24 w-24 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">내 예약</h1>
      </div>

      {/* 탭 필터 */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1); // 필터 변경 시 첫 페이지로
              }}
              className={`pb-4 px-1 border-b-2 font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label} ({statusCounts[tab.key] || 0})
            </button>
          ))}
        </div>
      </div>

      {reservations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">예약 내역이 없습니다.</p>
            <Link href="/posts">
              <Button>게시글 보기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reservations.map((reservation: Reservation) => {
              const post = reservation.post as {
                postId?: number;
                title?: string;
                thumbnailUrl?: string;
                author?: {
                  id?: number;
                  nickname?: string;
                  profileImgUrl?: string | null;
                };
              } | undefined;

              const status = reservation.status as string;
              const reservationStartDate =
                reservation.reservationStartAt &&
                new Date(
                  typeof reservation.reservationStartAt === "string"
                    ? reservation.reservationStartAt
                    : reservation.reservationStartAt,
                );
              const reservationEndDate =
                reservation.reservationEndAt &&
                new Date(
                  typeof reservation.reservationEndAt === "string"
                    ? reservation.reservationEndAt
                    : reservation.reservationEndAt,
                );

              // 후기 작성 가능 여부 확인
              const canWriteReview =
                status === "REFUND_COMPLETED" ||
                status === "RETURN_COMPLETED";

              // 취소 가능 여부 확인
              const canCancel =
                status === "PENDING_APPROVAL" || status === "PENDING_PAYMENT";

              // 결제 가능 여부 확인
              const canPay = status === "PENDING_PAYMENT";

              return (
                <Card key={reservation.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* 이미지 */}
                      <div className="flex-shrink-0">
                        <Link href={`/posts/${post?.postId || reservation.postId}`}>
                          <Image
                            src={getImageUrl(
                              post?.thumbnailUrl ||
                              (reservation.post as { thumbnailImageUrl?: string })?.thumbnailImageUrl,
                            )}
                            alt={post?.title || "게시글"}
                            width={120}
                            height={120}
                            className="rounded-lg object-cover w-[120px] h-[120px]"
                          />
                        </Link>
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <Link href={`/posts/${post?.postId || reservation.postId}`}>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600">
                                  {post?.title || "게시글"}
                                </h3>
                              </Link>
                              {reservationStartDate && reservationEndDate && (
                                <p className="text-sm text-gray-600 mb-1">
                                  대여 기간:{" "}
                                  {format(reservationStartDate, "yyyy-MM-dd", {
                                    locale: ko,
                                  })}{" "}
                                  -{" "}
                                  {format(reservationEndDate, "yyyy-MM-dd", {
                                    locale: ko,
                                  })}
                                </p>
                              )}
                              {post?.author?.nickname && (
                                <p className="text-sm text-gray-600 mb-1">
                                  호스트: {post.author.nickname}
                                </p>
                              )}
                              {reservation.totalAmount !== undefined && (
                                <p className="text-lg font-semibold text-gray-900">
                                  총 금액: {reservation.totalAmount.toLocaleString()}원
                                </p>
                              )}
                            </div>

                            {/* 상태 배지 */}
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ml-2 ${
                                statusColors[status] ||
                                "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {statusLabels[status] || status}
                            </span>
                          </div>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                          <Link href={`/reservations/${reservation.id}`}>
                            <Button variant="outline" size="sm">
                              상세보기
                            </Button>
                          </Link>
                          {canPay && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              결제하기
                            </Button>
                          )}
                          {canCancel && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                handleCancel(reservation.id);
                              }}
                              disabled={cancelMutation.isPending}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              취소
                            </Button>
                          )}
                          {canWriteReview && (
                            <Link href={`/reservations/${reservation.id}/review`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <Star className="h-4 w-4 mr-1" />
                                후기 작성
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
