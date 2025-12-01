/**
 * 예약 상세 페이지
 */
"use client";

import { differenceInDays, format } from "date-fns";
import { ko } from "date-fns/locale";
import { Suspense, useEffect, useState } from "react";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import type { ReservationLog } from "@/types/domain";
import { ReceiveMethod, ReservationStatus } from "@/types/domain";

import { getImageUrl } from "@/lib/utils/image";
import {
  canCompleteInspection as canCompleteInspectionUtil,
  canCompletePickup as canCompletePickupUtil,
  canCompleteRefund as canCompleteRefundUtil,
  canCompleteReturnInspection as canCompleteReturnInspectionUtil,
  canReceiveReturn as canReceiveReturnUtil,
  canRequestRefund as canRequestRefundUtil,
  canSendReturnShipping as canSendReturnShippingUtil,
  canStartReturn as canStartReturnUtil,
  handleCompletePickup as handleCompletePickupUtil,
  handleCompleteRefund as handleCompleteRefundUtil,
  handleCompleteRentalInspection as handleCompleteRentalInspectionUtil,
  handleCompleteReturnInspection as handleCompleteReturnInspectionUtil,
  handleMarkLostOrUnreturned as handleMarkLostOrUnreturnedUtil,
  handleReceiveReturn as handleReceiveReturnUtil,
  handleRequestRefund as handleRequestRefundUtil,
  handleStartReturn as handleStartReturnUtil,
} from "@/lib/utils/reservation";

import { parseLocalDateString } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

import { usePostQuery } from "@/queries/post";
import { useReservationQuery } from "@/queries/reservation";
import {
  useApproveReservationMutation,
  useCancelReservationMutation,
  useRejectReservationMutation,
  useUpdateReservationStatusMutation,
} from "@/queries/reservation";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  MapPin,
  Package,
  Pencil,
  Truck,
  User,
  Wrench,
  X,
} from "lucide-react";

/**
 * 예약 상세 페이지
 */

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: "승인 대기",
  PENDING_PAYMENT: "결제 대기",
  PENDING_PICKUP: "수령 대기",
  SHIPPING: "배송 중",
  INSPECTING_RENTAL: "대여 검수",
  RENTING: "대여 중",
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
  CLAIMING: "bg-red-100 text-red-800",
  CLAIM_COMPLETED: "bg-gray-100 text-gray-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const RECEIVE_METHOD_LABELS: Record<ReceiveMethod, string> = {
  DIRECT: "만나서 수령",
  DELIVERY: "택배",
  ANY: "상관없음",
};

const RETURN_METHOD_LABELS: Record<ReceiveMethod, string> = {
  DIRECT: "만나서 반납",
  DELIVERY: "택배 반납",
  ANY: "상관없음",
};

type TabType = "info" | "progress" | "delivery";

/**
 * 예약 상세 페이지 (내부 컴포넌트)
 */
function ReservationDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const reservationId = Number(params.id);
  const { user } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);

  const { data: reservation, isLoading: reservationLoading } =
    useReservationQuery(reservationId);
  const { data: post } = usePostQuery(reservation?.postId || 0);

  const approveMutation = useApproveReservationMutation();
  const rejectMutation = useRejectReservationMutation();
  const cancelMutation = useCancelReservationMutation();
  const updateStatusMutation = useUpdateReservationStatusMutation();

  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isInspectCancelDialogOpen, setIsInspectCancelDialogOpen] =
    useState(false);
  const [inspectCancelReason, setInspectCancelReason] = useState("");
  const [isReturnShipDialogOpen, setIsReturnShipDialogOpen] = useState(false);
  const [returnShipCarrier, setReturnShipCarrier] = useState("");
  const [returnShipTracking, setReturnShipTracking] = useState("");
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState("");
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [claimReason, setClaimReason] = useState("");

  // 예약 소유자(게스트) 또는 게시글 작성자(호스트)만 접근 가능
  useEffect(() => {
    if (reservationLoading) return;
    if (!reservation) return;
    if (!user) return;

    const reservationAuthorId = reservation.author?.id ?? reservation.authorId;
    const isReservationOwner = reservationAuthorId === user.id;

    // 호스트(게시글 작성자) 식별: 예약 응답 안에 포함된 post 정보 또는 별도 조회한 post 정보 모두 사용
    const postAuthorIdFromReservation =
      reservation.post?.author?.id ?? reservation.post?.authorId;
    const postAuthorIdFromPost = post?.author?.id ?? post?.authorId;
    const postAuthorId = postAuthorIdFromReservation ?? postAuthorIdFromPost;

    const isPostOwner = postAuthorId !== undefined && postAuthorId === user.id;

    // 게스트/호스트 어느 쪽도 아니고, 아직 호스트 정보를 알 수 없는 상태라면 post가 로드될 때까지 대기
    if (!isReservationOwner && postAuthorId === undefined) {
      return;
    }

    if (!isReservationOwner && !isPostOwner) {
      showToast("예약 상세 정보를 볼 권한이 없습니다.", "error");
      router.push("/profile/reservations");
    }
  }, [reservation, reservationLoading, user, post, router, showToast]);

  const handleApprove = async () => {
    if (!reservation) return;
    try {
      await approveMutation.mutateAsync(reservation.id);
      showToast("예약이 승인되었습니다.", "success");
    } catch (error) {
      console.error("Failed to approve reservation:", error);
    }
  };

  const handlePayment = () => {
    if (!reservation) return;
    router.push(`/payments/toss/${reservation.id}`);
  };

  const handleReject = async () => {
    if (!reservation || !rejectReason.trim()) {
      showToast("거절 사유를 입력해주세요.", "error");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        reservationId: reservation.id,
        reason: rejectReason,
      });
      showToast("예약이 거절되었습니다.", "success");
      setIsRejectDialogOpen(false);
      setRejectReason("");
    } catch (error) {
      console.error("Failed to reject reservation:", error);
    }
  };

  const handleCancel = async () => {
    if (!reservation) return;
    if (!cancelReason.trim()) {
      showToast("취소 사유를 입력해주세요.", "error");
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        reservationId: reservation.id,
        reason: cancelReason.trim(),
      });
      showToast("예약이 취소되었습니다.", "success");
      setIsCancelDialogOpen(false);
      setCancelReason("");
    } catch (error) {
      console.error("Failed to cancel reservation:", error);
    }
  };

  // 상태 변경 핸들러들
  const handleStartShipping = async () => {
    if (!reservation) return;
    setIsShippingDialogOpen(true);
  };

  const handleCompletePickup = async () => {
    if (!reservation) return;
    await handleCompletePickupUtil(
      reservation.id,
      updateStatusMutation,
      showToast,
    );
  };

  const handleCompleteRentalInspection = async () => {
    if (!reservation) return;
    await handleCompleteRentalInspectionUtil(
      reservation.id,
      updateStatusMutation,
      showToast,
    );
  };

  const handleStartReturn = async () => {
    if (!reservation) return;
    await handleStartReturnUtil(
      reservation.id,
      updateStatusMutation,
      showToast,
    );
  };

  const handleReceiveReturn = async () => {
    if (!reservation) return;
    await handleReceiveReturnUtil(
      reservation.id,
      updateStatusMutation,
      showToast,
    );
  };

  const handleCompleteReturnInspection = async () => {
    if (!reservation) return;
    await handleCompleteReturnInspectionUtil(
      reservation.id,
      updateStatusMutation,
      showToast,
    );
  };

  const handleCompleteRefund = async () => {
    if (!reservation) return;
    await handleCompleteRefundUtil(
      reservation.id,
      updateStatusMutation,
      showToast,
    );
  };

  // 추가 핸들러들
  const handleInspectCancel = async () => {
    if (!reservation) return;
    if (!inspectCancelReason.trim()) {
      showToast("취소 사유를 입력해주세요.", "error");
      return;
    }
    try {
      await updateStatusMutation.mutateAsync({
        reservationId: reservation.id,
        data: {
          status: ReservationStatus.PENDING_RETURN,
          cancelReason: inspectCancelReason.trim(),
        },
      });
      showToast("대여 취소 및 반납 대기 상태로 변경되었습니다.", "success");
      setIsInspectCancelDialogOpen(false);
      setInspectCancelReason("");
    } catch (error) {
      console.error("Failed to cancel during inspection:", error);
    }
  };

  const handleReturnShipping = async () => {
    if (!reservation) return;
    if (!returnShipCarrier.trim() || !returnShipTracking.trim()) {
      showToast("택배사와 송장번호를 모두 입력해주세요.", "error");
      return;
    }
    try {
      await updateStatusMutation.mutateAsync({
        reservationId: reservation.id,
        data: {
          status: ReservationStatus.RETURNING,
          returnCarrier: returnShipCarrier.trim(),
          returnTrackingNumber: returnShipTracking.trim(),
        },
      });
      showToast("반납 중 상태로 변경되었습니다.", "success");
      setIsReturnShipDialogOpen(false);
      setReturnShipCarrier("");
      setReturnShipTracking("");
    } catch (error) {
      console.error("Failed to send return shipping:", error);
    }
  };

  const handleShipping = async () => {
    if (!reservation) return;
    if (!shippingCarrier.trim() || !shippingTrackingNumber.trim()) {
      showToast("택배사와 송장번호를 모두 입력해주세요.", "error");
      return;
    }
    try {
      await updateStatusMutation.mutateAsync({
        reservationId: reservation.id,
        data: {
          status: ReservationStatus.SHIPPING,
          receiveCarrier: shippingCarrier.trim(),
          receiveTrackingNumber: shippingTrackingNumber.trim(),
        },
      });
      showToast("배송 정보가 등록되었습니다.", "success");
      setIsShippingDialogOpen(false);
      setShippingCarrier("");
      setShippingTrackingNumber("");
    } catch (error) {
      console.error("Failed to update shipping info:", error);
    }
  };

  const handleClaim = async () => {
    if (!reservation) return;
    if (!claimReason.trim()) {
      showToast("청구 사유를 입력해주세요.", "error");
      return;
    }
    try {
      await updateStatusMutation.mutateAsync({
        reservationId: reservation.id,
        data: {
          status: ReservationStatus.CLAIMING,
          claimReason: claimReason.trim(),
        },
      });
      showToast("청구 진행 상태로 변경되었습니다.", "success");
      setIsClaimDialogOpen(false);
      setClaimReason("");
    } catch (error) {
      console.error("Failed to request claim:", error);
    }
  };

  const handleRequestRefund = async () => {
    if (!reservation) return;
    await handleRequestRefundUtil(
      reservation.id,
      updateStatusMutation,
      showToast,
    );
  };

  const handleMarkLostOrUnreturned = async () => {
    if (!reservation) return;
    await handleMarkLostOrUnreturnedUtil(
      reservation.id,
      updateStatusMutation,
      showToast,
    );
  };

  if (reservationLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            {!user ? (
              <>
                <p className="text-gray-700 font-semibold">
                  로그인이 필요합니다
                </p>
                <p className="text-sm text-gray-500">
                  예약 상세 정보를 확인하려면 먼저 로그인해주세요.
                </p>
                <Button onClick={() => router.push("/login")}>
                  로그인하러 가기
                </Button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4">예약을 찾을 수 없습니다.</p>
                <Button onClick={() => router.push("/profile/reservations")}>
                  예약 목록으로
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const reservationAuthorId = reservation.author?.id || reservation.authorId;
  const isReservationOwner = reservationAuthorId === user?.id;
  const postAuthorIdFromReservation =
    reservation.post?.author?.id ?? reservation.post?.authorId;
  const postAuthorIdFromPost = post?.author?.id ?? post?.authorId;
  const postAuthorId = postAuthorIdFromReservation ?? postAuthorIdFromPost;
  const isPostOwner = postAuthorId !== undefined && postAuthorId === user?.id;
  const status = reservation.status as string;
  const canApprove =
    isPostOwner && status === ReservationStatus.PENDING_APPROVAL;
  const canCancel =
    isReservationOwner &&
    (status === ReservationStatus.PENDING_APPROVAL ||
      status === ReservationStatus.PENDING_PAYMENT);

  // 상태 변경 버튼 조건
  // 호스트가 할 수 있는 액션
  const canStartShipping =
    isPostOwner &&
    status === ReservationStatus.PENDING_PICKUP &&
    reservation.receiveMethod === ReceiveMethod.DELIVERY;
  const canCompleteRentalInspection =
    isPostOwner && status === ReservationStatus.INSPECTING_RENTAL;
  const canCompleteReturnInspection = reservation
    ? canCompleteReturnInspectionUtil(reservation, isPostOwner)
    : false;
  const canCompleteRefund = reservation
    ? canCompleteRefundUtil(reservation, isPostOwner)
    : false;
  const canReceiveReturn = reservation
    ? canReceiveReturnUtil(reservation, isPostOwner)
    : false;
  const canRequestRefund = reservation
    ? canRequestRefundUtil(reservation, isPostOwner)
    : false;
  const canRequestClaim =
    isPostOwner &&
    (status === ReservationStatus.INSPECTING_RETURN ||
      status === ReservationStatus.LOST_OR_UNRETURNED);
  const canMarkLostOrUnreturned =
    isPostOwner && status === ReservationStatus.RENTING;

  // 예약자가 할 수 있는 액션
  const canCompletePickup = reservation
    ? canCompletePickupUtil(reservation, isReservationOwner)
    : false;
  const canCompleteInspection = reservation
    ? canCompleteInspectionUtil(reservation, isReservationOwner)
    : false;
  const canStartReturn = reservation
    ? canStartReturnUtil(reservation, isReservationOwner)
    : false;
  const canSendReturnShipping = reservation
    ? canSendReturnShippingUtil(reservation, isReservationOwner)
    : false;

  // 대여 기간 계산
  const startDate =
    reservation.reservationStartAt &&
    new Date(
      typeof reservation.reservationStartAt === "string"
        ? reservation.reservationStartAt
        : reservation.reservationStartAt,
    );
  const endDate =
    reservation.reservationEndAt &&
    new Date(
      typeof reservation.reservationEndAt === "string"
        ? reservation.reservationEndAt
        : reservation.reservationEndAt,
    );
  // 날짜만 추출하여 계산 (시간 부분 제거)
  const startDateOnly = startDate
    ? new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      )
    : null;
  const endDateOnly = endDate
    ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    : null;
  const daysDiff =
    startDateOnly && endDateOnly
      ? differenceInDays(endDateOnly, startDateOnly) + 1
      : 0;

  // 옵션 목록 (예약에는 id와 이름만 있고, 가격은 post의 options에서 가져옴)
  const reservationOptions =
    reservation.options?.map((ro) => ({
      id: ro.optionId || ro.id,
      name: ro.option?.name || `옵션 #${ro.optionId || ro.id}`,
    })) ||
    (reservation.option
      ?.map((opt: unknown, index: number) => {
        if (opt && typeof opt === "object" && ("name" in opt || "id" in opt)) {
          return {
            id:
              ("id" in opt && typeof opt.id === "number" ? opt.id : null) ||
              index,
            name:
              ("name" in opt && typeof opt.name === "string"
                ? opt.name
                : `옵션 #${index}`) || `옵션 #${index}`,
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ id: number; name: string }>) ||
    [];

  // post의 options에서 가격 정보를 가져와서 매칭
  const options = reservationOptions.map((resOpt) => {
    const postOption = post?.options?.find((po) => po.id === resOpt.id);
    return {
      id: resOpt.id,
      name: resOpt.name,
      fee: postOption?.fee || 0,
      deposit: postOption?.deposit || 0,
    };
  });

  // 결제 금액 계산
  const baseFee = post?.fee || 0;
  const baseDeposit = post?.deposit || 0;
  const rentalFee = baseFee * daysDiff;
  const optionsFee = options.reduce(
    (sum, opt) => sum + (opt.fee || 0) * daysDiff,
    0,
  );
  const optionsDeposit = options.reduce(
    (sum, opt) => sum + (opt.deposit || 0),
    0,
  );
  const totalRentalFee = rentalFee + optionsFee;
  const totalDeposit = baseDeposit + optionsDeposit;
  const totalAmount = totalRentalFee + totalDeposit;

  // 예약 로그 (타임라인)
  const logs = (reservation.logs || []) as ReservationLog[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 헤더 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 p-0 h-auto text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">예약 상세</h1>
            <p className="text-gray-600">예약 번호: #{reservation.id}</p>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              statusColors[status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {statusLabels[status] || status}
          </span>
        </div>
      </div>

      {/* 게시글 정보 카드 */}
      {post && (
        <Card className="mb-6">
          <CardContent className="p-6 pt-6">
            <div className="flex gap-6">
              {/* 이미지 */}
              <div className="flex-shrink-0">
                <Image
                  src={getImageUrl(
                    post.thumbnailImageUrl ||
                      post.images?.[0]?.file ||
                      post.images?.[0]?.url,
                  )}
                  alt={post.title}
                  width={200}
                  height={200}
                  className="rounded-lg object-cover w-[200px] h-[200px]"
                />
              </div>

              {/* 정보 */}
              <div className="flex-1 space-y-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {post.title}
                </h2>

                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>
                    작성자:{" "}
                    {post.author?.nickname || post.authorNickname || "작성자"}
                  </span>
                </div>

                {post.regions && post.regions.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {post.regions
                        .map((r) => r.name)
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}

                {startDate && endDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(startDate, "yyyy-MM-dd")} ~{" "}
                      {format(endDate, "yyyy-MM-dd")}
                    </span>
                  </div>
                )}

                {baseFee > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span>{baseFee.toLocaleString()}원</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("info")}
            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "info"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            예약 정보
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "progress"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            예약 진행
          </button>
          <button
            onClick={() => setActiveTab("delivery")}
            className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "delivery"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            배송 정보
          </button>
        </div>
      </div>

      {/* 탭 내용 */}
      <div className="space-y-6">
        {/* 예약 정보 탭 */}
        {activeTab === "info" && (
          <>
            {/* 예약자 정보 & 호스트 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    예약자 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {reservation.author?.profileImgUrl ? (
                      <Image
                        src={getImageUrl(reservation.author.profileImgUrl)}
                        alt={reservation.author.nickname || "예약자"}
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
                        {reservation.author?.nickname || "예약자"}
                      </p>
                      <p className="text-sm text-gray-600">예약자</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    호스트 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {post && (
                    <div className="flex items-center gap-3">
                      {post.author?.profileImgUrl ? (
                        <Image
                          src={getImageUrl(post.author.profileImgUrl)}
                          alt={
                            post.author?.nickname ||
                            post.authorNickname ||
                            "호스트"
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
                          {post.author?.nickname ||
                            post.authorNickname ||
                            "호스트"}
                        </p>
                        <p className="text-sm text-gray-600">호스트</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 대여 기간 */}
            {startDate && endDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    대여 기간
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">시작일</span>
                    <span className="font-medium">
                      {format(startDate, "yyyy-MM-dd")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">종료일</span>
                    <span className="font-medium">
                      {format(endDate, "yyyy-MM-dd")}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">총 기간</span>
                    <span className="font-semibold text-blue-600">
                      {daysDiff}일
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 수령 방식 & 반납 방식 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    수령 방식
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reservation.receiveMethod ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        {reservation.receiveMethod === ReceiveMethod.DIRECT ? (
                          <User className="h-5 w-5 text-gray-500" />
                        ) : (
                          <Truck className="h-5 w-5 text-gray-500" />
                        )}
                        <span className="font-medium">
                          {RECEIVE_METHOD_LABELS[reservation.receiveMethod]}
                        </span>
                      </div>
                      {reservation.receiveMethod === ReceiveMethod.DELIVERY &&
                        reservation.receiveAddress1 && (
                          <div className="mt-3 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{reservation.receiveAddress1}</span>
                            </div>
                            {reservation.receiveAddress2 && (
                              <p className="ml-6">
                                {reservation.receiveAddress2}
                              </p>
                            )}
                          </div>
                        )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-5 w-5" />
                      <span>미정</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    반납 방식
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reservation.returnMethod ? (
                    <div className="flex items-center gap-2">
                      {reservation.returnMethod === ReceiveMethod.DIRECT ? (
                        <User className="h-5 w-5 text-gray-500" />
                      ) : (
                        <Truck className="h-5 w-5 text-gray-500" />
                      )}
                      <span className="font-medium">
                        {RETURN_METHOD_LABELS[reservation.returnMethod]}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-5 w-5" />
                      <span>미정</span>
                    </div>
                  )}
                  {reservation.returnMethod === ReceiveMethod.DELIVERY &&
                    post?.returnAddress1 && (
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>반납 주소: {post.returnAddress1}</span>
                        </div>
                        {post.returnAddress2 && (
                          <p className="ml-6">{post.returnAddress2}</p>
                        )}
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>

            {/* 대여 장비 목록 */}
            {(options.length > 0 || (post && baseFee > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    대여 장비 목록
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 기본 게시글 */}
                  {post && baseFee > 0 && (
                    <div className="p-4 bg-pink-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded mb-2">
                            기본 장비
                          </span>
                          <p className="font-semibold text-gray-900">
                            {post.title}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {baseFee.toLocaleString()}원/일
                          </p>
                          {baseDeposit > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              보증금: {baseDeposit.toLocaleString()}원
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 옵션 목록 */}
                  {options.map((option) => (
                    <div key={option.id} className="p-4 bg-pink-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded mb-2">
                            추가 옵션
                          </span>
                          <p className="font-semibold text-gray-900">
                            {option.name}
                          </p>
                        </div>
                        <div className="text-right">
                          {option.fee > 0 ? (
                            <p className="text-sm font-medium text-gray-900">
                              {option.fee.toLocaleString()}원/일
                            </p>
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              무료
                            </p>
                          )}
                          {option.deposit > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              보증금: {option.deposit.toLocaleString()}원
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 결제 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  결제 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">대여료 ({daysDiff}일)</span>
                  <span className="font-medium">
                    {totalRentalFee.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">보증금</span>
                  <span className="font-medium">
                    {totalDeposit.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">
                    총 결제금액
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {totalAmount.toLocaleString()}원
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 요청 메시지 */}
            {/* TODO: API에 메시지 필드가 추가되면 표시 */}
          </>
        )}

        {/* 예약 진행 탭 */}
        {activeTab === "progress" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">예약 진행 상황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    진행 상황이 없습니다.
                  </div>
                ) : (
                  logs.map((log, index) => {
                    const logStatus = log.status as string;
                    const isLast = index === logs.length - 1;
                    const isCompleted = [
                      ReservationStatus.RETURN_COMPLETED,
                      ReservationStatus.REFUND_COMPLETED,
                      ReservationStatus.CLAIM_COMPLETED,
                      ReservationStatus.REJECTED,
                      ReservationStatus.CANCELLED,
                    ].includes(logStatus as ReservationStatus);

                    // 상태에 따른 메시지 생성
                    const getStatusMessage = (status: string): string => {
                      switch (status) {
                        case ReservationStatus.PENDING_APPROVAL:
                          return "대여 신청이 접수되었습니다.";
                        case ReservationStatus.PENDING_PAYMENT:
                          return "호스트가 예약을 승인했습니다.";
                        case ReservationStatus.PENDING_PICKUP:
                          return "결제가 성공적으로 완료되었습니다.";
                        case ReservationStatus.INSPECTING_RENTAL:
                          return "대여 검수가 진행 중입니다.";
                        case ReservationStatus.RENTING:
                          return "대여가 시작되었습니다.";
                        case ReservationStatus.PENDING_RETURN:
                          return "반납 대기 중입니다.";
                        case ReservationStatus.INSPECTING_RETURN:
                          return "반납 검수가 진행 중입니다.";
                        case ReservationStatus.RETURN_COMPLETED:
                          return "반납이 완료되었습니다.";
                        case ReservationStatus.PENDING_REFUND:
                          return "환급이 예정되었습니다.";
                        case ReservationStatus.REFUND_COMPLETED:
                          return "환급이 완료되었습니다.";
                        case ReservationStatus.REJECTED:
                          return "예약이 거절되었습니다.";
                        case ReservationStatus.CANCELLED:
                          return "예약이 취소되었습니다.";
                        case ReservationStatus.LOST_OR_UNRETURNED:
                          return "장비가 미반납 또는 분실되었습니다.";
                        case ReservationStatus.CLAIMING:
                          return "청구가 진행 중입니다.";
                        case ReservationStatus.CLAIM_COMPLETED:
                          return "청구가 완료되었습니다.";
                        default:
                          return statusLabels[status] || status;
                      }
                    };

                    // 상태에 따른 아이콘과 색상 결정
                    let iconColor = "bg-gray-100 text-gray-600";
                    let Icon = Clock;
                    if (isCompleted) {
                      if (
                        logStatus === ReservationStatus.REJECTED ||
                        logStatus === ReservationStatus.CANCELLED
                      ) {
                        iconColor = "bg-red-100 text-red-600";
                        Icon = X;
                      } else {
                        iconColor = "bg-green-100 text-green-600";
                        Icon = CheckCircle2;
                      }
                    } else if (
                      logStatus === ReservationStatus.PENDING_APPROVAL ||
                      logStatus === ReservationStatus.PENDING_PAYMENT ||
                      logStatus === ReservationStatus.PENDING_PICKUP ||
                      logStatus === ReservationStatus.PENDING_RETURN ||
                      logStatus === ReservationStatus.PENDING_REFUND
                    ) {
                      iconColor = "bg-yellow-100 text-yellow-600";
                      Icon = Clock;
                    } else if (
                      logStatus === ReservationStatus.INSPECTING_RENTAL ||
                      logStatus === ReservationStatus.INSPECTING_RETURN
                    ) {
                      iconColor = "bg-purple-100 text-purple-600";
                      Icon = Package;
                    } else if (logStatus === ReservationStatus.RENTING) {
                      iconColor = "bg-blue-100 text-blue-600";
                      Icon = CheckCircle2;
                    }

                    // 시간 파싱 (서버가 현지 시간으로 보내는 경우를 가정)
                    const formatLogTime = (dateStr: string | Date): string => {
                      const date =
                        dateStr instanceof Date
                          ? dateStr
                          : parseLocalDateString(dateStr);
                      return format(date, "yyyy. MM. dd. a h:mm:ss", {
                        locale: ko,
                      });
                    };

                    return (
                      <div key={log.id} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          {!isLast && (
                            <div className="w-0.5 h-6 bg-gray-200 mx-auto mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="font-medium text-gray-900 mb-1">
                            {getStatusMessage(logStatus)}
                          </p>
                          {/* 사용자 아이콘과 닉네임 */}
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-600">
                              {log.authorNickname || "알 수 없는 사용자"}
                            </span>
                          </div>
                          {/* 날짜 */}
                          {log.createdAt && (
                            <p className="text-xs text-gray-500">
                              {formatLogTime(log.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 배송 정보 탭 */}
        {activeTab === "delivery" && (
          <div className="space-y-6">
            {/* 수령 정보 */}
            {reservation.receiveMethod && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    수령 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    {reservation.receiveMethod === ReceiveMethod.DIRECT ? (
                      <User className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Truck className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="font-medium">
                      수령 방식:{" "}
                      {RECEIVE_METHOD_LABELS[reservation.receiveMethod]}
                    </span>
                  </div>
                  {reservation.receiveMethod === ReceiveMethod.DELIVERY &&
                    reservation.receiveAddress1 && (
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{reservation.receiveAddress1}</span>
                        </div>
                        {reservation.receiveAddress2 && (
                          <p className="ml-6">{reservation.receiveAddress2}</p>
                        )}
                      </div>
                    )}
                  {reservation.receiveTrackingNumber && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          운송장 번호
                        </span>
                        <span className="text-sm font-medium">
                          {reservation.receiveTrackingNumber}
                        </span>
                      </div>
                      {reservation.receiveCarrier && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">택배사</span>
                          <span className="text-sm font-medium">
                            {reservation.receiveCarrier}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 반납 정보 */}
            {reservation.returnMethod && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    반납 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    {reservation.returnMethod === ReceiveMethod.DIRECT ? (
                      <User className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Truck className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="font-medium">
                      반납 방식:{" "}
                      {RETURN_METHOD_LABELS[reservation.returnMethod]}
                    </span>
                  </div>
                  {reservation.returnMethod === ReceiveMethod.DELIVERY &&
                    post?.returnAddress1 && (
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            {post.author?.nickname ||
                              post.authorNickname ||
                              "호스트"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>반납 주소: {post.returnAddress1}</span>
                        </div>
                        {post.returnAddress2 && (
                          <p className="ml-6">{post.returnAddress2}</p>
                        )}
                      </div>
                    )}
                  {reservation.returnTrackingNumber && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          운송장 번호
                        </span>
                        <span className="text-sm font-medium">
                          {reservation.returnTrackingNumber}
                        </span>
                      </div>
                      {reservation.returnCarrier && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">택배사</span>
                          <span className="text-sm font-medium">
                            {reservation.returnCarrier}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 배송 안내 */}
            {reservation.receiveMethod === ReceiveMethod.DELIVERY && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    배송 안내
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 배송은 영업일 기준 1-2일 소요됩니다.</li>
                    <li>• 수령 시 장비 상태를 반드시 확인해주세요.</li>
                    <li>• 배송 중 파손은 택배사 보상 규정을 따릅니다.</li>
                    <li>• 반납 시에도 동일한 포장 상태로 발송해주세요.</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* 하단 액션 버튼들 */}
      <div className="mt-8 space-y-3">
        {/* 상태 변경 버튼들 */}
        <div className="flex gap-3 flex-wrap">
          {/* 호스트 액션 - 승인/거절 */}
          {canApprove && (
            <>
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50 flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {approveMutation.isPending ? "승인 중..." : "예약 승인"}
              </Button>
              <Button
                onClick={() => setIsRejectDialogOpen(true)}
                disabled={rejectMutation.isPending}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50 flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                {rejectMutation.isPending ? "거절 중..." : "예약 거절"}
              </Button>
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {canStartShipping && (
            <>
              <Button
                onClick={handleStartShipping}
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Truck className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending ? "처리 중..." : "배송 보내기"}
              </Button>
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {canCompleteRentalInspection && (
            <>
              <Button
                onClick={handleCompleteRentalInspection}
                disabled={updateStatusMutation.isPending}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending
                  ? "처리 중..."
                  : "대여 검수 완료"}
              </Button>
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {canReceiveReturn && (
            <>
              <Button
                onClick={handleReceiveReturn}
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="flex-1 text-purple-600 border-purple-600 hover:bg-purple-50"
              >
                <Package className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending ? "처리 중..." : "수령 완료"}
              </Button>
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {canCompleteReturnInspection && (
            <>
              <Button
                onClick={handleCompleteReturnInspection}
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending ? "처리 중..." : "검수완료"}
              </Button>
              {canRequestClaim && (
                <Button
                  onClick={() => setIsClaimDialogOpen(true)}
                  disabled={updateStatusMutation.isPending}
                  variant="outline"
                  className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  청구 요청
                </Button>
              )}
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {canRequestRefund && (
            <>
              <Button
                onClick={handleRequestRefund}
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending ? "처리 중..." : "환급 요청"}
              </Button>
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {canCompleteRefund && (
            <>
              <Button
                onClick={handleCompleteRefund}
                disabled={updateStatusMutation.isPending}
                className="flex-1"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending ? "처리 중..." : "환급 완료"}
              </Button>
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {canRequestClaim &&
            status === ReservationStatus.LOST_OR_UNRETURNED && (
              <>
                <Button
                  onClick={() => setIsClaimDialogOpen(true)}
                  disabled={updateStatusMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  청구 요청
                </Button>
                <Button
                  onClick={() => router.push("/profile/reservations")}
                  variant="outline"
                  className="flex-1"
                >
                  예약 목록으로
                </Button>
              </>
            )}
          {canMarkLostOrUnreturned && (
            <>
              <Button
                onClick={handleMarkLostOrUnreturned}
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                미반납/분실 처리
              </Button>
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}

          {/* 예약자 액션 */}
          {status === "PENDING_PAYMENT" && isReservationOwner && (
            <>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handlePayment}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                결제하기
              </Button>
              {canCancel && (
                <Button
                  onClick={() => setIsCancelDialogOpen(true)}
                  variant="outline"
                  className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  예약 취소
                </Button>
              )}
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {canCompletePickup && (
            <>
              <Button
                onClick={handleCompletePickup}
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending ? "처리 중..." : "수령 완료"}
              </Button>
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {canCompleteInspection && (
            <>
              <Button
                onClick={handleCompleteRentalInspection}
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending ? "처리 중..." : "검수완료"}
              </Button>
              <Button
                onClick={() => setIsInspectCancelDialogOpen(true)}
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                대여 취소
              </Button>
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {canStartReturn && (
            <>
              <Button
                onClick={handleStartReturn}
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Package className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending ? "처리 중..." : "반납하기"}
              </Button>
              {isReservationOwner && status === ReservationStatus.RENTING && (
                <Button
                  onClick={handleMarkLostOrUnreturned}
                  disabled={updateStatusMutation.isPending}
                  variant="outline"
                  className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  미반납/분실 처리
                </Button>
              )}
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {canSendReturnShipping && (
            <>
              <Button
                onClick={() => setIsReturnShipDialogOpen(true)}
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Truck className="h-4 w-4 mr-2" />
                {updateStatusMutation.isPending ? "처리 중..." : "반납 보내기"}
              </Button>
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}

          {/* 공통 액션 */}
          {/* 승인 대기 상태에서만 예약 수정 가능 */}
          {isReservationOwner && status === "PENDING_APPROVAL" && (
            <>
              <Button
                onClick={() =>
                  router.push(
                    `/reservations/new?postId=${reservation.postId}&reservationId=${reservation.id}`,
                  )
                }
                variant="outline"
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-2" />
                예약 수정
              </Button>
              {canCancel && (
                <Button
                  onClick={() => setIsCancelDialogOpen(true)}
                  variant="outline"
                  className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  예약 취소
                </Button>
              )}
              <Button
                onClick={() => router.push("/profile/reservations")}
                variant="outline"
                className="flex-1"
              >
                예약 목록으로
              </Button>
            </>
          )}
          {/* 예약 취소 (결제 대기 상태가 아니고 승인 대기 상태도 아닐 때만 별도로 표시) */}
          {canCancel &&
            !(status === "PENDING_PAYMENT" && isReservationOwner) &&
            !(isReservationOwner && status === "PENDING_APPROVAL") && (
              <>
                <Button
                  onClick={() => setIsCancelDialogOpen(true)}
                  variant="outline"
                  className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  예약 취소
                </Button>
                <Button
                  onClick={() => router.push("/profile/reservations")}
                  variant="outline"
                  className="flex-1"
                >
                  예약 목록으로
                </Button>
              </>
            )}
        </div>
      </div>

      {/* 예약 취소 다이얼로그 */}
      <Dialog
        open={isCancelDialogOpen}
        onOpenChange={(open) => {
          setIsCancelDialogOpen(open);
          if (!open) {
            setCancelReason("");
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
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
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

      {/* 예약 거절 다이얼로그 */}
      <Dialog
        open={isRejectDialogOpen}
        onOpenChange={(open) => {
          setIsRejectDialogOpen(open);
          if (!open) {
            setRejectReason("");
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
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
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

      {/* 대여 검수 단계 취소 다이얼로그 */}
      <Dialog
        open={isInspectCancelDialogOpen}
        onOpenChange={(open) => {
          setIsInspectCancelDialogOpen(open);
          if (!open) {
            setInspectCancelReason("");
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
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInspectCancelDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              닫기
            </Button>
            <Button
              variant="danger"
              onClick={handleInspectCancel}
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
        open={isReturnShipDialogOpen}
        onOpenChange={(open) => {
          setIsReturnShipDialogOpen(open);
          if (!open) {
            setReturnShipCarrier("");
            setReturnShipTracking("");
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
              onClick={() => setIsReturnShipDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              닫기
            </Button>
            <Button
              onClick={handleReturnShipping}
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

      {/* 배송 보내기 다이얼로그 */}
      <Dialog
        open={isShippingDialogOpen}
        onOpenChange={(open) => {
          setIsShippingDialogOpen(open);
          if (!open) {
            setShippingCarrier("");
            setShippingTrackingNumber("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>배송 보내기</DialogTitle>
            <DialogDescription>
              게스트에게 보낼 택배의 정보를 입력해주세요.
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
              onClick={() => setIsShippingDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              닫기
            </Button>
            <Button
              onClick={handleShipping}
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

      {/* 청구 요청 다이얼로그 */}
      <Dialog
        open={isClaimDialogOpen}
        onOpenChange={(open) => {
          setIsClaimDialogOpen(open);
          if (!open) {
            setClaimReason("");
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
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsClaimDialogOpen(false)}
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
    </div>
  );
}

export default function ReservationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-48 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      }
    >
      <ReservationDetailPageContent />
    </Suspense>
  );
}
