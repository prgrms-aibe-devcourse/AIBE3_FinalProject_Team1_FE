/**
 * 마이페이지 - 내 게시글
 */
"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import type { Post, Reservation } from "@/types/domain";
import { ReceiveMethod, ReservationStatus } from "@/types/domain";

import { getImageUrl } from "@/lib/utils/image";

import { parseLocalDateString } from "@/lib/utils";
import {
  calculateReservationAmount,
  calculateReservationDays,
  type ReservationOptionForCalculation,
} from "@/lib/utils/reservation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";

import { useUIStore } from "@/store/uiStore";
import {
  handleCompleteReturnInspection as handleCompleteReturnInspectionUtil,
  handleMarkLostOrUnreturned as handleMarkLostOrUnreturnedUtil,
  handleReceiveReturn as handleReceiveReturnUtil,
  handleRequestRefund as handleRequestRefundUtil,
} from "@/lib/utils/reservation";

import { useMyPostsQuery } from "@/queries/post";
import {
  useApproveReservationMutation,
  useRejectReservationMutation,
  useReservationsByPostQuery,
  useUpdateReservationStatusMutation,
} from "@/queries/reservation";
import { useCategoryListQuery } from "@/queries/category";
import { useRegionListQuery } from "@/queries/region";

import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Truck,
  User,
  X,
} from "lucide-react";

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

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

const RECEIVE_METHOD_LABELS: Record<ReceiveMethod, string> = {
  DIRECT: "직거래",
  DELIVERY: "택배",
  ANY: "상관없음",
};

/**
 * 게시글 카드 컴포넌트 (예약 목록 포함)
 */
function PostCard({ post }: { post: Post }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showToast = useUIStore((state) => state.showToast);
  const approveMutation = useApproveReservationMutation();
  const rejectMutation = useRejectReservationMutation();
  const updateStatusMutation = useUpdateReservationStatusMutation();
  const { data: categories } = useCategoryListQuery();
  const { data: regions } = useRegionListQuery();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimReason, setClaimReason] = useState("");
  const [claimTargetId, setClaimTargetId] = useState<number | null>(null);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [shippingMode, setShippingMode] = useState<"receive" | "return">(
    "receive",
  );
  const [shippingTarget, setShippingTarget] = useState<Reservation | null>(
    null,
  );
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState("");

  const { data: reservationsData, isLoading: reservationsLoading } =
    useReservationsByPostQuery(post.id, {
      sort: ["id,desc"], // 최신순 정렬
      enabled: isExpanded, // 펼쳐졌을 때만 조회
    });

  const reservations = useMemo(() => {
    if (!reservationsData) return [];
    return Array.isArray(reservationsData)
      ? reservationsData
      : reservationsData.content || [];
  }, [reservationsData]);

  const handleApprove = async (reservationId: number) => {
    try {
      await approveMutation.mutateAsync(reservationId);
      showToast("예약이 승인되었습니다.", "success");
    } catch (error) {
      console.error("Failed to approve reservation:", error);
    }
  };

  const handleReject = async () => {
    if (!rejectTargetId) return;
    if (!rejectReason.trim()) {
      showToast("거절 사유를 입력해주세요.", "error");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        reservationId: rejectTargetId,
        reason: rejectReason.trim(),
      });
      showToast("예약이 거절되었습니다.", "success");
      setRejectDialogOpen(false);
      setRejectReason("");
      setRejectTargetId(null);
    } catch (error) {
      console.error("Failed to reject reservation:", error);
    }
  };

  const handleClaim = async () => {
    if (!claimTargetId) return;
    if (!claimReason.trim()) {
      showToast("청구 사유를 입력해주세요.", "error");
      return;
    }
    try {
      await updateStatusMutation.mutateAsync({
        reservationId: claimTargetId,
        data: {
          status: ReservationStatus.CLAIMING,
          claimReason: claimReason.trim(),
        },
      });
      showToast("청구 진행 상태로 변경되었습니다.", "success");
      setClaimDialogOpen(false);
      setClaimReason("");
      setClaimTargetId(null);
    } catch (error) {
      console.error("Failed to request claim:", error);
    }
  };

  const openShippingDialog = (
    reservation: Reservation,
    mode: "receive" | "return",
  ) => {
    setShippingTarget(reservation);
    setShippingMode(mode);
    setShippingCarrier("");
    setShippingTrackingNumber("");
    setShippingDialogOpen(true);
  };

  const handleConfirmShipping = async () => {
    if (!shippingTarget) return;
    if (!shippingCarrier.trim() || !shippingTrackingNumber.trim()) {
      showToast("택배사와 송장번호를 모두 입력해주세요.", "error");
      return;
    }

    try {
      if (shippingMode === "receive") {
        await updateStatusMutation.mutateAsync({
          reservationId: shippingTarget.id,
          data: {
            status: ReservationStatus.SHIPPING,
            receiveCarrier: shippingCarrier.trim(),
            receiveTrackingNumber: shippingTrackingNumber.trim(),
          },
        });
        showToast("배송 정보가 등록되었습니다.", "success");
      } else {
        await updateStatusMutation.mutateAsync({
          reservationId: shippingTarget.id,
          data: {
            status: ReservationStatus.RETURNING,
            returnCarrier: shippingCarrier.trim(),
            returnTrackingNumber: shippingTrackingNumber.trim(),
          },
        });
        showToast("반납 배송 정보가 등록되었습니다.", "success");
      }
      setShippingDialogOpen(false);
      setShippingTarget(null);
      setShippingCarrier("");
      setShippingTrackingNumber("");
    } catch (error) {
      console.error("Failed to update shipping info:", error);
    }
  };

  // 카테고리 정보 찾기
  const findCategory = (
    catId: number,
    catList: typeof categories,
  ): { main: string; sub: string } | null => {
    if (!catList) return null;
    for (const mainCat of catList) {
      const subCategories = mainCat.child || mainCat.children || [];
      const subCat = subCategories.find((c) => c.id === catId);
      if (subCat) {
        return { main: mainCat.name, sub: subCat.name };
      }
    }
    return null;
  };
  const categoryInfo =
    post.categoryId && categories
      ? findCategory(post.categoryId, categories)
      : null;

  // 지역 정보 찾기 (메인 페이지와 동일한 방식)
  const findRegionById = (id: number): import("@/types/domain").Region | null => {
    if (!regions) return null;
    for (const region of regions) {
      if (region.id === id) return region;
      if (region.child) {
        const child = region.child.find((r) => r.id === id);
        if (child) return child;
      }
      if (region.children) {
        const child = region.children.find((r) => r.id === id);
        if (child) return child;
      }
    }
    return null;
  };


  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent padding="compact">
        {/* 게시글 정보 */}
        <div className="flex items-center gap-4">
          {/* 이미지 */}
          <div className="shrink-0">
            <Image
              src={getImageUrl(
                post.thumbnailImageUrl ||
                  post.images?.[0]?.file ||
                  post.images?.[0]?.url,
              )}
              alt={post.title}
              width={120}
              height={120}
              className="rounded-lg object-cover w-[120px] h-[120px]"
            />
          </div>

          {/* 정보 */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
                {/* 카테고리 */}
                {categoryInfo && (
                  <div className="text-sm text-gray-600 mb-1">
                    {categoryInfo.main} &gt; {categoryInfo.sub}
                  </div>
                )}
                {/* 지역 */}
                {(() => {
                  let regionNames: string[] = [];
                  
                  // 1. post.regions 배열이 있으면 사용
                  if (post.regions && Array.isArray(post.regions) && post.regions.length > 0) {
                    regionNames = post.regions
                      .map((r) => {
                        if (typeof r === "object" && r !== null && "name" in r) {
                          return r.name as string;
                        }
                        return null;
                      })
                      .filter((name): name is string => Boolean(name));
                  }
                  // 2. post.regionIds가 있고 regions 목록이 로드되었으면 findRegionById 사용 (메인 페이지와 동일)
                  else if (post.regionIds && Array.isArray(post.regionIds) && post.regionIds.length > 0 && regions) {
                    regionNames = post.regionIds
                      .map((id) => findRegionById(id))
                      .filter((r) => r !== null)
                      .map((r) => r!.name);
                  }
                  
                  return regionNames.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <MapPin className="h-4 w-4" />
                      <span>{regionNames.join(", ")}</span>
                    </div>
                  ) : null;
                })()}
                {/* 수령/반납 방법 */}
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                  <span>수령: {RECEIVE_METHOD_LABELS[post.receiveMethod]}</span>
                  <span>반납: {RECEIVE_METHOD_LABELS[post.returnMethod]}</span>
                </div>
                {/* 작성일 */}
                <p className="text-sm text-gray-600 mb-1">
                  {post.createdAt &&
                    `작성일: ${format(
                      parseLocalDateString(post.createdAt),
                      "yyyy-MM-dd",
                      {
                        locale: ko,
                      },
                    )}`}
                </p>
                {/* 가격 정보 */}
                <div className="flex items-center gap-4 text-sm mt-2">
                  <span className="font-semibold text-blue-600">
                    대여료: {post.fee?.toLocaleString() || 0}원/일
                  </span>
                  <span className="text-gray-600">
                    보증금: {post.deposit?.toLocaleString() || 0}원
                  </span>
                </div>
              </div>

              {/* 예약 건수 */}
              {isExpanded && reservations.length > 0 && (
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    예약 {reservations.length}건
                  </span>
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex items-center gap-2 mt-2">
              {/* 펼치기 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    예약 목록 보기
                  </>
                )}
              </Button>

              {/* 상세보기 버튼 */}
              <Link href={`/posts/${post.id}`}>
                <Button variant="outline" size="sm">
                  상세보기
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 예약 목록 (펼쳐졌을 때만 표시) */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {reservationsLoading ? (
              <div className="text-center py-8 text-gray-500">
                예약 목록을 불러오는 중...
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                예약이 없습니다.
              </div>
            ) : (
              <>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  예약 목록 (총 {reservations.length}건의 예약)
                </h4>
                <div className="space-y-4">
                  {reservations.map((reservation: Reservation) => {
                    // 대여 기간 계산 (공통 유틸 사용)
                    const reservationDays = calculateReservationDays(
                      reservation.reservationStartAt,
                      reservation.reservationEndAt,
                    );
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

                    // 옵션 목록
                    const options: ReservationOptionForCalculation[] =
                      reservation.options?.map((ro) => ({
                        id: ro.id,
                        name: ro.option?.name || `옵션 #${ro.optionId}`,
                        fee: ro.option?.fee || 0,
                        deposit: ro.option?.deposit || 0,
                      })) ||
                      (reservation.option
                        ?.map((opt: unknown, index: number) => {
                          if (
                            opt &&
                            typeof opt === "object" &&
                            ("name" in opt || "id" in opt)
                          ) {
                            return {
                              id: ("id" in opt && opt.id) || index,
                              name:
                                ("name" in opt && opt.name) || `옵션 #${index}`,
                              fee: ("fee" in opt && opt.fee) || 0,
                              deposit: ("deposit" in opt && opt.deposit) || 0,
                            };
                          }
                          return null;
                        })
                        .filter(Boolean) as ReservationOptionForCalculation[]) ||
                      [];

                    // 총 금액: 서버에서 제공하는 totalAmount 우선 사용, 없으면 클라이언트에서 계산 (공통 유틸 사용)
                    let totalAmount: number;
                    if (reservation.totalAmount !== undefined && reservation.totalAmount !== null) {
                      totalAmount = reservation.totalAmount;
                    } else {
                      // fallback: 클라이언트에서 계산
                      const amountCalc = calculateReservationAmount(
                        post,
                        options,
                        reservationDays,
                      );
                      totalAmount = amountCalc.totalAmount;
                    }

                    const status = reservation.status as string;
                    const canConfirmReturnReceive =
                      status === "RETURNING" ||
                      (status === "PENDING_RETURN" &&
                        reservation.returnMethod != null &&
                        reservation.returnMethod === ReceiveMethod.DIRECT);
                    const canCompleteReturnInspection =
                      status === "INSPECTING_RETURN";
                    const canRequestRefund = status === "RETURN_COMPLETED";
                    const canMarkLostOrUnreturned = status === "RENTING";
                    const canRequestClaimForLost =
                      status === "LOST_OR_UNRETURNED";

                    return (
                      <Card key={reservation.id} className="bg-gray-50">
                        <CardContent padding="compact">
                          <div className="flex items-start justify-between mb-4">
                            {/* 예약자 정보 */}
                            <div className="flex items-center gap-3">
                              {reservation.author?.profileImgUrl ? (
                                <Image
                                  src={getImageUrl(
                                    reservation.author.profileImgUrl,
                                  )}
                                  alt={
                                    reservation.author.nickname ||
                                    reservation.author?.name ||
                                    "예약자"
                                  }
                                  width={48}
                                  height={48}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {reservation.author?.nickname ||
                                    reservation.author?.name ||
                                    "예약자"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  신청일:{" "}
                                  {reservation.createdAt &&
                                    format(
                                      parseLocalDateString(
                                        reservation.createdAt,
                                      ),
                                      "yyyy-MM-dd",
                                      { locale: ko },
                                    )}
                                </p>
                              </div>
                            </div>

                            {/* 상태 */}
                            <span
                              className={`rounded-full px-3 py-1 text-sm font-medium ${
                                statusColors[status] ||
                                "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {statusLabels[status] || status}
                            </span>
                          </div>

                          {/* 선택한 장비 */}
                          {options.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                선택한 장비
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {options.map((option) => (
                                  <div
                                    key={option.id}
                                    className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-gray-200"
                                  >
                                    <span className="text-sm text-gray-900">
                                      {option.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 대여 기간 */}
                          {reservationStartDate && reservationEndDate && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                대여 기간
                              </p>
                              <p className="text-sm text-gray-900">
                                {format(reservationStartDate, "yyyy-MM-dd", {
                                  locale: ko,
                                })}{" "}
                                -{" "}
                                {format(reservationEndDate, "yyyy-MM-dd", {
                                  locale: ko,
                                })}{" "}
                                ({reservationDays}일)
                              </p>
                            </div>
                          )}

                          {/* 총 결제금액 */}
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              총 결제금액
                            </p>
                            <p className="text-lg font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-block">
                              {totalAmount.toLocaleString()}원
                            </p>
                          </div>

                          {/* 수령/반납 방식 + 취소/거절 사유 + 액션 버튼 (한 줄 배치) */}
                          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 text-sm">
                            <div className="flex-1 flex flex-wrap items-center gap-2 text-gray-700">
                              {reservation.receiveMethod && (
                                <span className="inline-flex items-center gap-1">
                                  <span>수령:</span>
                                  {reservation.receiveMethod ===
                                  ReceiveMethod.DIRECT ? (
                                    <User className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <Truck className="h-4 w-4 text-gray-500" />
                                  )}
                                  <span>
                                    {
                                      RECEIVE_METHOD_LABELS[
                                        reservation.receiveMethod
                                      ]
                                    }
                                  </span>
                                </span>
                              )}
                              {reservation.returnMethod && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span className="inline-flex items-center gap-1">
                                    <span>반납:</span>
                                    {reservation.returnMethod ===
                                    ReceiveMethod.DIRECT ? (
                                      <User className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Truck className="h-4 w-4 text-gray-500" />
                                    )}
                                    <span>
                                      {
                                        RECEIVE_METHOD_LABELS[
                                          reservation.returnMethod
                                        ]
                                      }
                                    </span>
                                  </span>
                                </>
                              )}
                              {(status === "CANCELLED" &&
                                reservation.cancelReason) ||
                              (status === "REJECTED" &&
                                reservation.rejectReason) ? (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span
                                    className={
                                      status === "CANCELLED"
                                        ? "text-red-600"
                                        : "text-orange-600"
                                    }
                                  >
                                    {status === "CANCELLED"
                                      ? "취소 사유: "
                                      : "거절 사유: "}
                                    {status === "CANCELLED"
                                      ? reservation.cancelReason
                                      : reservation.rejectReason}
                                  </span>
                                </>
                              ) : null}
                            </div>

                            <div className="flex items-center justify-end gap-2 shrink-0">
                              <Link href={`/reservations/${reservation.id}`}>
                                <Button variant="outline" size="sm">
                                  상세보기
                                </Button>
                              </Link>

                              {(status === "PENDING" ||
                                status === "PENDING_APPROVAL") && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleApprove(reservation.id)
                                    }
                                    disabled={approveMutation.isPending}
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    승인
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setRejectTargetId(reservation.id);
                                      setRejectReason("");
                                      setRejectDialogOpen(true);
                                    }}
                                    disabled={rejectMutation.isPending}
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    거절
                                  </Button>
                                </>
                              )}

                              {status === "PENDING_PICKUP" &&
                                reservation.receiveMethod != null &&
                                reservation.receiveMethod ===
                                  ReceiveMethod.DELIVERY && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openShippingDialog(reservation, "receive")
                                    }
                                    disabled={updateStatusMutation.isPending}
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                  >
                                    <Truck className="h-4 w-4 mr-1" />
                                    배송 보내기
                                  </Button>
                                )}

                              {/* 호스트 - 반납 중일 때 수령완료 (RETURNING → INSPECTING_RETURN) */}
                              {/* 호스트 - 반납 대기(직거래)일 때 수령완료 (PENDING_RETURN + DIRECT → INSPECTING_RETURN) */}
                              {canConfirmReturnReceive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    await handleReceiveReturnUtil(
                                      reservation.id,
                                      updateStatusMutation,
                                      showToast,
                                    );
                                  }}
                                  disabled={updateStatusMutation.isPending}
                                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                                >
                                  수령완료
                                </Button>
                              )}

                              {/* 호스트 - 반납 검수 단계에서 검수완료 / 청구 요청 (INSPECTING_RETURN → RETURN_COMPLETED / CLAIMING) */}
                              {canCompleteReturnInspection && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      await handleCompleteReturnInspectionUtil(
                                        reservation.id,
                                        updateStatusMutation,
                                        showToast,
                                      );
                                    }}
                                    disabled={updateStatusMutation.isPending}
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                  >
                                    검수완료
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setClaimTargetId(reservation.id);
                                      setClaimReason("");
                                      setClaimDialogOpen(true);
                                    }}
                                    disabled={updateStatusMutation.isPending}
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                  >
                                    청구 요청
                                  </Button>
                                </>
                              )}

                              {/* 호스트 - 반납 완료 상태에서 환급 요청 (RETURN_COMPLETED → PENDING_REFUND) */}
                              {canRequestRefund && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    await handleRequestRefundUtil(
                                      reservation.id,
                                      updateStatusMutation,
                                      showToast,
                                    );
                                  }}
                                  disabled={updateStatusMutation.isPending}
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                >
                                  환급 요청
                                </Button>
                              )}

                              {/* 호스트 - 대여 중일 때 미반납/분실 처리 (RENTING → LOST_OR_UNRETURNED) */}
                              {canMarkLostOrUnreturned && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    await handleMarkLostOrUnreturnedUtil(
                                      reservation.id,
                                      updateStatusMutation,
                                      showToast,
                                    );
                                  }}
                                  disabled={updateStatusMutation.isPending}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  미반납/분실 처리
                                </Button>
                              )}

                              {/* 호스트 - 미반납/분실 상태일 때 청구 요청 (LOST_OR_UNRETURNED → CLAIMING) */}
                              {canRequestClaimForLost && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setClaimTargetId(reservation.id);
                                    setClaimReason("");
                                    setClaimDialogOpen(true);
                                  }}
                                  disabled={updateStatusMutation.isPending}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  청구 요청
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* 배송 / 반납 송장 입력 다이얼로그 */}
        <Dialog
          open={shippingDialogOpen}
          onOpenChange={(open) => {
            setShippingDialogOpen(open);
            if (!open) {
              setShippingTarget(null);
              setShippingCarrier("");
              setShippingTrackingNumber("");
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {shippingMode === "receive" ? "배송 보내기" : "반납 보내기"}
              </DialogTitle>
              <DialogDescription>
                {shippingMode === "receive"
                  ? "게스트에게 보낼 택배의 정보를 입력해주세요."
                  : "반납 택배 정보를 입력해주세요."}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  택배사
                </label>
                <input
                  type="text"
                  value={shippingCarrier}
                  onChange={(e) => setShippingCarrier(e.target.value)}
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
                  value={shippingTrackingNumber}
                  onChange={(e) => setShippingTrackingNumber(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="송장번호를 입력해주세요"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShippingDialogOpen(false)}
                disabled={updateStatusMutation.isPending}
              >
                닫기
              </Button>
              <Button
                onClick={handleConfirmShipping}
                disabled={
                  updateStatusMutation.isPending ||
                  !shippingCarrier.trim() ||
                  !shippingTrackingNumber.trim()
                }
              >
                {updateStatusMutation.isPending ? "저장 중..." : "등록하기"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 예약 거절 다이얼로그 */}
        <Dialog
          open={rejectDialogOpen}
          onOpenChange={(open) => {
            setRejectDialogOpen(open);
            if (!open) {
              setRejectReason("");
              setRejectTargetId(null);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>예약 거절</DialogTitle>
              <DialogDescription>
                예약을 거절하려면 거절 사유를 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="거절 사유를 입력해주세요"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
                disabled={rejectMutation.isPending}
              >
                닫기
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
              >
                {rejectMutation.isPending ? "거절 중..." : "거절하기"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 청구 요청 다이얼로그 */}
        <Dialog
          open={claimDialogOpen}
          onOpenChange={(open) => {
            setClaimDialogOpen(open);
            if (!open) {
              setClaimReason("");
              setClaimTargetId(null);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>청구 요청</DialogTitle>
              <DialogDescription>
                청구 요청하려면 청구 사유를 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 space-y-4">
              <textarea
                value={claimReason}
                onChange={(e) => setClaimReason(e.target.value)}
                placeholder="청구 사유를 입력해주세요"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setClaimDialogOpen(false)}
                disabled={updateStatusMutation.isPending}
              >
                닫기
              </Button>
              <Button
                variant="danger"
                onClick={handleClaim}
                disabled={updateStatusMutation.isPending || !claimReason.trim()}
              >
                {updateStatusMutation.isPending ? "요청 중..." : "청구 요청"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

/**
 * 마이페이지 - 내 게시글
 */
export default function MyPostsPage() {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<string[]>(["createdAt,DESC"]);
  const pageSize = 10;

  const { data: myPostsData, isLoading: postsLoading } = useMyPostsQuery({
    page: page,
    size: pageSize,
    sort,
  });

  const posts = useMemo(() => {
    if (!myPostsData) return [];
    return Array.isArray(myPostsData) ? myPostsData : myPostsData.content || [];
  }, [myPostsData]);

  const totalPages = useMemo(() => {
    if (!myPostsData || Array.isArray(myPostsData)) return 1;
    return myPostsData.page?.totalPages || 1;
  }, [myPostsData]);

  const totalElements = useMemo(() => {
    if (!myPostsData || Array.isArray(myPostsData)) {
      return Array.isArray(myPostsData) ? myPostsData.length : 0;
    }
    return myPostsData.page?.totalElements || 0;
  }, [myPostsData]);

  const handleSortChange = (sortField: "createdAt" | "deposit" | "fee") => {
    const currentSort = sort || ["createdAt,DESC"];
    const currentOrder = currentSort[0]?.split(",")[1] || "DESC";
    setSort([`${sortField},${currentOrder}`]);
    setPage(0); // 정렬 변경 시 첫 페이지로
  };

  const handleOrderChange = (order: "asc" | "desc") => {
    const currentSort = sort || ["createdAt,DESC"];
    const currentSortField = currentSort[0]?.split(",")[0] || "createdAt";
    const orderUpper = order.toUpperCase();
    setSort([`${currentSortField},${orderUpper}`]);
    setPage(0); // 정렬 변경 시 첫 페이지로
  };

  return (
    <div className="p-0">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">내 게시글</h1>
        <Link href="/posts/new">
          <Button>게시글 등록</Button>
        </Link>
      </div>

      {/* 총 게시글 수 및 정렬 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span>총 {totalElements}개의 게시글</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">정렬:</label>
          <select
            value={sort?.[0]?.split(",")[0] || "createdAt"}
            onChange={(e) =>
              handleSortChange(
                e.target.value as "createdAt" | "deposit" | "fee",
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="createdAt">등록일</option>
            <option value="deposit">보증금</option>
            <option value="fee">대여료</option>
          </select>
          <select
            value={sort?.[0]?.split(",")[1]?.toLowerCase() || "desc"}
            onChange={(e) =>
              handleOrderChange(e.target.value as "asc" | "desc")
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </div>
      </div>

      {/* 게시글 목록 */}
      {postsLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent padding="compact">
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
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 pt-12 text-center">
            <p className="text-gray-500 mb-4">게시글이 없습니다.</p>
            <Link href="/posts/new">
              <Button>게시글 작성하기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post: Post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {posts.length > 0 && (
        <div className="mt-8">
          <Pagination
            currentPage={page + 1}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage - 1)}
          />
        </div>
      )}
    </div>
  );
}
