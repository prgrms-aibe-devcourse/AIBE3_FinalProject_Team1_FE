/**
 * 마이페이지 - 내 예약
 */
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Star, X } from "lucide-react";

import type { Reservation } from "@/types/domain";
import { ReceiveMethod, ReservationStatus } from "@/types/domain";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { getImageUrl } from "@/lib/utils/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  useMyReservationsQuery,
  useCancelReservationMutation,
  useUpdateReservationStatusMutation,
} from "@/queries/reservation";
import { useCreateReviewMutation } from "@/queries/review";
import { useUIStore } from "@/store/uiStore";
import {
  handleCompletePickup as handleCompletePickupUtil,
  handleCompleteRentalInspection as handleCompleteRentalInspectionUtil,
  handleStartReturn as handleStartReturnUtil,
  handleMarkLostOrUnreturned as handleMarkLostOrUnreturnedUtil,
  canCompleteInspection as canCompleteInspectionUtil,
  canStartReturn as canStartReturnUtil,
  canSendReturnShipping as canSendReturnShippingUtil,
} from "@/lib/utils/reservation";

type StatusFilter =
  | "all"
  | "PENDING_APPROVAL"
  | "PENDING_PAYMENT"
  | "PENDING_PICKUP"
  | "RENTING"
  | "RETURN_COMPLETED"
  | "PENDING_REFUND"
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
  { key: "PENDING_REFUND", label: "환급 예정" },
  { key: "REFUND_COMPLETED", label: "환급 완료" },
  { key: "LOST_OR_UNRETURNED", label: "미반납/분실" },
  { key: "CLAIMING", label: "청구 진행" },
  { key: "CLAIM_COMPLETED", label: "청구 완료" },
  { key: "REJECTED", label: "승인 거절" },
  { key: "CANCELLED", label: "예약 취소" },
];

export default function MyReservationsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const showToast = useUIStore((state) => state.showToast);
  const cancelMutation = useCancelReservationMutation();
  const updateStatusMutation = useUpdateReservationStatusMutation();
  const [inspectCancelDialogOpen, setInspectCancelDialogOpen] =
    useState(false);
  const [inspectCancelReason, setInspectCancelReason] = useState("");
  const [inspectCancelTargetId, setInspectCancelTargetId] = useState<
    number | null
  >(null);
  const [returnShipDialogOpen, setReturnShipDialogOpen] = useState(false);
  const [returnShipCarrier, setReturnShipCarrier] = useState("");
  const [returnShipTracking, setReturnShipTracking] = useState("");
  const [returnShipTargetId, setReturnShipTargetId] = useState<number | null>(
    null,
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewTargetId, setReviewTargetId] = useState<number | null>(null);
  const [equipmentScore, setEquipmentScore] = useState(5);
  const [kindnessScore, setKindnessScore] = useState(5);
  const [responseTimeScore, setResponseTimeScore] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const createReviewMutation = useCreateReviewMutation();

  const { data: myReservations, isLoading: reservationsLoading } =
    useMyReservationsQuery({
      page: page,
      size: pageSize,
      sort: ["id,desc"], // 최신순 정렬
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


  const handleCancel = async () => {
    if (!cancelTargetId) return;
    if (!cancelReason.trim()) {
      showToast("취소 사유를 입력해주세요.", "error");
      return;
    }
    try {
      await cancelMutation.mutateAsync({
        reservationId: cancelTargetId,
        reason: cancelReason.trim(),
      });
      showToast("예약이 취소되었습니다.", "success");
      setCancelDialogOpen(false);
      setCancelReason("");
      setCancelTargetId(null);
    } catch (error) {
      console.error("Failed to cancel reservation:", error);
    }
  };

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
                setPage(0); // 필터 변경 시 첫 페이지로
              }}
              className={`pb-4 px-1 border-b-2 font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 예약 목록 */}
      {reservationsLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 pt-4">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 bg-gray-200 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <Card>
          <CardContent className="p-12 pt-12 text-center">
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
              const hasReviewed = reservation.hasReviewed ?? false;
              const canWriteReview =
                !hasReviewed &&
                (status === "RETURN_COMPLETED" ||
                  status === "INSPECTING_RETURN" ||
                  status === "PENDING_REFUND" ||
                  status === "REFUND_COMPLETED");

              // 취소 가능 여부 확인 (승인 대기, 결제 대기, 수령 대기에서 가능)
              const canCancel =
                status === "PENDING_APPROVAL" ||
                status === "PENDING_PAYMENT" ||
                status === "PENDING_PICKUP";

              // 결제 가능 여부 확인
              const canPay = status === "PENDING_PAYMENT";

              // 게스트 측 상태 변경 가능 여부
              const canConfirmReceive =
                status === "SHIPPING" ||
                (status === "PENDING_PICKUP" &&
                  reservation.receiveMethod != null &&
                  reservation.receiveMethod === ReceiveMethod.DIRECT);
              const canCompleteInspection = canCompleteInspectionUtil(
                reservation,
                true,
              );
              const canStartReturn = canStartReturnUtil(reservation, true);
              const canSendReturnShipping = canSendReturnShippingUtil(
                reservation,
                true,
              );

              return (
                <Card key={reservation.id} className="transition-shadow hover:shadow-md">
                  <CardContent padding="compact">
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
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                          <Link href={`/reservations/${reservation.id}`}>
                            <Button variant="outline" size="sm">
                              상세보기
                            </Button>
                          </Link>

                          {canPay && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() =>
                                router.push(`/payments/toss/${reservation.id}`)
                              }
                            >
                              결제하기
                            </Button>
                          )}

                          {/* 게스트 - 배송 받았을 때 수령하기 (SHIPPING → PENDING_RETURN or INSPECTING_RENTAL) */}
                          {canConfirmReceive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await handleCompletePickupUtil(
                                  reservation.id,
                                  updateStatusMutation,
                                  showToast,
                                );
                              }}
                              disabled={updateStatusMutation.isPending}
                              className="border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                              수령완료
                            </Button>
                          )}

                          {/* 게스트 - 대여 검수 단계에서 검수 완료 (INSPECTING_RENTAL → RENTING) */}
                          {canCompleteInspection && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await handleCompleteRentalInspectionUtil(
                                    reservation.id,
                                    updateStatusMutation,
                                    showToast,
                                  );
                                }}
                                disabled={updateStatusMutation.isPending}
                                className="border-green-600 text-green-600 hover:bg-green-50"
                              >
                                검수완료
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setInspectCancelTargetId(reservation.id);
                                  setInspectCancelReason("");
                                  setInspectCancelDialogOpen(true);
                                }}
                                disabled={updateStatusMutation.isPending}
                                className="border-red-600 text-red-600 hover:bg-red-50"
                              >
                                대여 취소
                              </Button>
                            </>
                          )}

                          {/* 게스트 - 대여 중일 때 반납하기 (RENTING → PENDING_RETURN) */}
                          {canStartReturn && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await handleStartReturnUtil(
                                    reservation.id,
                                    updateStatusMutation,
                                    showToast,
                                  );
                                }}
                                disabled={updateStatusMutation.isPending}
                                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                              >
                                반납하기
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await handleMarkLostOrUnreturnedUtil(
                                    reservation.id,
                                    updateStatusMutation,
                                    showToast,
                                  );
                                }}
                                disabled={updateStatusMutation.isPending}
                                className="border-red-600 text-red-600 hover:bg-red-50"
                              >
                                미반납/분실 처리
                              </Button>
                            </>
                          )}


                          {/* 게스트 - 반납 대기(택배)일 때 반납 보내기 (PENDING_RETURN → RETURNING) */}
                          {canSendReturnShipping && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReturnShipTargetId(reservation.id);
                                setReturnShipCarrier("");
                                setReturnShipTracking("");
                                setReturnShipDialogOpen(true);
                              }}
                              disabled={updateStatusMutation.isPending}
                              className="border-purple-600 text-purple-600 hover:bg-purple-50"
                            >
                              반납 보내기
                            </Button>
                          )}

                          {canCancel && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                setCancelTargetId(reservation.id);
                                setCancelReason("");
                                setCancelDialogOpen(true);
                              }}
                              disabled={cancelMutation.isPending}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              예약 취소
                            </Button>
                          )}

                          {canWriteReview && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => {
                                setReviewTargetId(reservation.id);
                                setEquipmentScore(5);
                                setKindnessScore(5);
                                setResponseTimeScore(5);
                                setReviewComment("");
                                setReviewDialogOpen(true);
                              }}
                            >
                              <Star className="h-4 w-4 mr-1" />
                              후기 작성
                            </Button>
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
              currentPage={page + 1}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage - 1)}
            />
          </div>
        </>
      )}

      {/* 대여 검수 단계 취소 다이얼로그 */}
      <Dialog
        open={inspectCancelDialogOpen}
        onOpenChange={(open) => {
          setInspectCancelDialogOpen(open);
          if (!open) {
            setInspectCancelReason("");
            setInspectCancelTargetId(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>대여 취소</DialogTitle>
            <DialogDescription>
              대여 검수 단계에서 대여를 진행하지 않고 반납만 진행하려는 경우,
              취소 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <textarea
              value={inspectCancelReason}
              onChange={(e) => setInspectCancelReason(e.target.value)}
              placeholder="취소 사유를 입력해주세요"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInspectCancelDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              닫기
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!inspectCancelTargetId) return;
                if (!inspectCancelReason.trim()) {
                  showToast("취소 사유를 입력해주세요.", "error");
                  return;
                }
                try {
                  await updateStatusMutation.mutateAsync({
                    reservationId: inspectCancelTargetId,
                    data: {
                      status: ReservationStatus.PENDING_RETURN,
                      cancelReason: inspectCancelReason.trim(),
                    },
                  });
                  showToast("대여 취소 및 반납 대기 상태로 변경되었습니다.", "success");
                  setInspectCancelDialogOpen(false);
                  setInspectCancelReason("");
                  setInspectCancelTargetId(null);
                } catch (error) {
                  console.error("Failed to cancel during inspection:", error);
                }
              }}
              disabled={
                updateStatusMutation.isPending || !inspectCancelReason.trim()
              }
            >
              {updateStatusMutation.isPending ? "처리 중..." : "대여 취소"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 반납 택배 발송 다이얼로그 */}
      <Dialog
        open={returnShipDialogOpen}
        onOpenChange={(open) => {
          setReturnShipDialogOpen(open);
          if (!open) {
            setReturnShipCarrier("");
            setReturnShipTracking("");
            setReturnShipTargetId(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>반납 보내기</DialogTitle>
            <DialogDescription>
              반납 택배를 보낼 때 택배사와 송장번호를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                택배사
              </label>
              <input
                type="text"
                value={returnShipCarrier}
                onChange={(e) => setReturnShipCarrier(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                placeholder="예: CJ대한통운"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                송장번호
              </label>
              <input
                type="text"
                value={returnShipTracking}
                onChange={(e) => setReturnShipTracking(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                placeholder="송장번호를 입력해주세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReturnShipDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              닫기
            </Button>
            <Button
              onClick={async () => {
                if (!returnShipTargetId) return;
                if (!returnShipCarrier.trim() || !returnShipTracking.trim()) {
                  showToast(
                    "택배사와 송장번호를 모두 입력해주세요.",
                    "error",
                  );
                  return;
                }
                try {
                  await updateStatusMutation.mutateAsync({
                    reservationId: returnShipTargetId,
                    data: {
                      status: ReservationStatus.RETURNING,
                      returnCarrier: returnShipCarrier.trim(),
                      returnTrackingNumber: returnShipTracking.trim(),
                    },
                  });
                  showToast("반납 중 상태로 변경되었습니다.", "success");
                  setReturnShipDialogOpen(false);
                  setReturnShipCarrier("");
                  setReturnShipTracking("");
                  setReturnShipTargetId(null);
                } catch (error) {
                  console.error("Failed to send return shipping:", error);
                }
              }}
              disabled={
                updateStatusMutation.isPending ||
                !returnShipCarrier.trim() ||
                !returnShipTracking.trim()
              }
            >
              {updateStatusMutation.isPending ? "처리 중..." : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 후기 작성 다이얼로그 */}
      <Dialog
        open={reviewDialogOpen}
        onOpenChange={(open) => {
          setReviewDialogOpen(open);
          if (!open) {
            setReviewTargetId(null);
            setEquipmentScore(0);
            setKindnessScore(0);
            setResponseTimeScore(0);
            setReviewComment("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>후기 작성</DialogTitle>
            <DialogDescription>
              장비 상태, 호스트 친절도, 응답 속도에 대해 평가하고 후기를 남겨주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            {/* 장비 상태 */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">장비 상태</p>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEquipmentScore(idx + 1)}
                    className="p-1"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        idx < equipmentScore
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 친절도 */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">친절도</p>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setKindnessScore(idx + 1)}
                    className="p-1"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        idx < kindnessScore
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 응답 속도 */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">응답 속도</p>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setResponseTimeScore(idx + 1)}
                    className="p-1"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        idx < responseTimeScore
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 코멘트 */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">코멘트</p>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="후기를 입력해주세요 (최소 1자 이상)"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={createReviewMutation.isPending}
            >
              닫기
            </Button>
            <Button
              onClick={async () => {
                if (!reviewTargetId) return;
                if (!reviewComment.trim()) {
                  showToast("후기 내용을 입력해주세요.", "error");
                  return;
                }
                try {
                  await createReviewMutation.mutateAsync({
                    reservationId: reviewTargetId,
                    equipmentScore,
                    kindnessScore,
                    responseTimeScore,
                    comment: reviewComment.trim(),
                  });
                  setReviewDialogOpen(false);
                  setReviewTargetId(null);
                  setEquipmentScore(0);
                  setKindnessScore(0);
                  setResponseTimeScore(0);
                  setReviewComment("");
                } catch (error) {
                  console.error("Failed to create review:", error);
                }
              }}
              disabled={
                createReviewMutation.isPending || !reviewComment.trim()
              }
            >
              {createReviewMutation.isPending ? "작성 중..." : "작성하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일반 예약 취소 다이얼로그 (게스트용) */}
      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) {
            setCancelReason("");
            setCancelTargetId(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>예약 취소</DialogTitle>
            <DialogDescription>
              예약을 취소하려면 취소 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="취소 사유를 입력해주세요"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelMutation.isPending}
            >
              닫기
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={cancelMutation.isPending || !cancelReason.trim()}
            >
              {cancelMutation.isPending ? "취소 중..." : "취소하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
