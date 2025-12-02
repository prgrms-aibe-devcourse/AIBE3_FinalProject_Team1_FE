/**
 * 예약 관련 공용 유틸 함수
 */
import { differenceInDays } from "date-fns";
import type { Reservation } from "@/types/domain";
import { ReceiveMethod, ReservationStatus } from "@/types/domain";

/**
 * 수령완료 처리 (PENDING_PICKUP/SHIPPING + DIRECT → INSPECTING_RENTAL)
 */
export async function handleCompletePickup(
  reservationId: number,
  updateStatusMutation: {
    mutateAsync: (params: {
      reservationId: number;
      data: { status: ReservationStatus };
    }) => Promise<unknown>;
  },
  showToast: (message: string, type: "success" | "error") => void,
): Promise<void> {
  try {
    await updateStatusMutation.mutateAsync({
      reservationId,
      data: { status: ReservationStatus.INSPECTING_RENTAL },
    });
    showToast("수령 완료 처리되었습니다.", "success");
  } catch (error) {
    console.error("Failed to complete pickup:", error);
    throw error;
  }
}

/**
 * 검수완료 처리 (INSPECTING_RENTAL → RENTING)
 */
export async function handleCompleteRentalInspection(
  reservationId: number,
  updateStatusMutation: {
    mutateAsync: (params: {
      reservationId: number;
      data: { status: ReservationStatus };
    }) => Promise<unknown>;
  },
  showToast: (message: string, type: "success" | "error") => void,
): Promise<void> {
  try {
    await updateStatusMutation.mutateAsync({
      reservationId,
      data: { status: ReservationStatus.RENTING },
    });
    showToast("검수가 완료되었습니다.", "success");
  } catch (error) {
    console.error("Failed to complete rental inspection:", error);
    throw error;
  }
}

/**
 * 반납하기 처리 (RENTING → PENDING_RETURN)
 */
export async function handleStartReturn(
  reservationId: number,
  updateStatusMutation: {
    mutateAsync: (params: {
      reservationId: number;
      data: { status: ReservationStatus };
    }) => Promise<unknown>;
  },
  showToast: (message: string, type: "success" | "error") => void,
): Promise<void> {
  try {
    await updateStatusMutation.mutateAsync({
      reservationId,
      data: {
        status: ReservationStatus.PENDING_RETURN,
      },
    });
    showToast("반납 대기 상태로 변경되었습니다.", "success");
  } catch (error) {
    console.error("Failed to start return:", error);
    throw error;
  }
}

/**
 * 미반납/분실 처리 (RENTING → LOST_OR_UNRETURNED)
 */
export async function handleMarkLostOrUnreturned(
  reservationId: number,
  updateStatusMutation: {
    mutateAsync: (params: {
      reservationId: number;
      data: { status: ReservationStatus };
    }) => Promise<unknown>;
  },
  showToast: (message: string, type: "success" | "error") => void,
): Promise<void> {
  try {
    await updateStatusMutation.mutateAsync({
      reservationId,
      data: { status: ReservationStatus.LOST_OR_UNRETURNED },
    });
    showToast("미반납/분실 상태로 변경되었습니다.", "success");
  } catch (error) {
    console.error("Failed to mark lost or unreturned:", error);
    throw error;
  }
}

/**
 * 수령완료 가능 여부 확인
 */
export function canCompletePickup(
  reservation: Reservation,
  isReservationOwner: boolean,
): boolean {
  return (
    isReservationOwner &&
    (reservation.status === ReservationStatus.PENDING_PICKUP ||
      reservation.status === ReservationStatus.SHIPPING) &&
    reservation.receiveMethod === ReceiveMethod.DIRECT
  );
}

/**
 * 검수완료 가능 여부 확인
 */
export function canCompleteInspection(
  reservation: Reservation,
  isReservationOwner: boolean,
): boolean {
  return (
    isReservationOwner &&
    reservation.status === ReservationStatus.INSPECTING_RENTAL
  );
}

/**
 * 반납하기 가능 여부 확인
 */
export function canStartReturn(
  reservation: Reservation,
  isReservationOwner: boolean,
): boolean {
  return (
    isReservationOwner && reservation.status === ReservationStatus.RENTING
  );
}

/**
 * 반납 보내기 가능 여부 확인
 */
export function canSendReturnShipping(
  reservation: Reservation,
  isReservationOwner: boolean,
): boolean {
  return (
    isReservationOwner &&
    reservation.status === ReservationStatus.PENDING_RETURN &&
    reservation.returnMethod === ReceiveMethod.DELIVERY
  );
}

/**
 * 반납 수령 완료 처리 (RETURNING/PENDING_RETURN + DIRECT → INSPECTING_RETURN)
 */
export async function handleReceiveReturn(
  reservationId: number,
  updateStatusMutation: {
    mutateAsync: (params: {
      reservationId: number;
      data: { status: ReservationStatus };
    }) => Promise<unknown>;
  },
  showToast: (message: string, type: "success" | "error") => void,
): Promise<void> {
  try {
    await updateStatusMutation.mutateAsync({
      reservationId,
      data: { status: ReservationStatus.INSPECTING_RETURN },
    });
    showToast(
      "반납 수령 완료 처리되었습니다. (반납 검수 단계로 이동)",
      "success",
    );
  } catch (error) {
    console.error("Failed to receive return:", error);
    throw error;
  }
}

/**
 * 반납 검수 완료 처리 (INSPECTING_RETURN → RETURN_COMPLETED)
 */
export async function handleCompleteReturnInspection(
  reservationId: number,
  updateStatusMutation: {
    mutateAsync: (params: {
      reservationId: number;
      data: { status: ReservationStatus };
    }) => Promise<unknown>;
  },
  showToast: (message: string, type: "success" | "error") => void,
): Promise<void> {
  try {
    await updateStatusMutation.mutateAsync({
      reservationId,
      data: { status: ReservationStatus.RETURN_COMPLETED },
    });
    showToast("반납 검수가 완료되었습니다.", "success");
  } catch (error) {
    console.error("Failed to complete return inspection:", error);
    throw error;
  }
}

/**
 * 환급 요청 처리 (RETURN_COMPLETED → PENDING_REFUND)
 */
export async function handleRequestRefund(
  reservationId: number,
  updateStatusMutation: {
    mutateAsync: (params: {
      reservationId: number;
      data: { status: ReservationStatus };
    }) => Promise<unknown>;
  },
  showToast: (message: string, type: "success" | "error") => void,
): Promise<void> {
  try {
    await updateStatusMutation.mutateAsync({
      reservationId,
      data: { status: ReservationStatus.PENDING_REFUND },
    });
    showToast("환급 요청이 접수되었습니다.", "success");
  } catch (error) {
    console.error("Failed to request refund:", error);
    throw error;
  }
}

/**
 * 환급 완료 처리 (PENDING_REFUND → REFUND_COMPLETED)
 */
export async function handleCompleteRefund(
  reservationId: number,
  updateStatusMutation: {
    mutateAsync: (params: {
      reservationId: number;
      data: { status: ReservationStatus };
    }) => Promise<unknown>;
  },
  showToast: (message: string, type: "success" | "error") => void,
): Promise<void> {
  try {
    await updateStatusMutation.mutateAsync({
      reservationId,
      data: { status: ReservationStatus.REFUND_COMPLETED },
    });
    showToast("환급이 완료되었습니다.", "success");
  } catch (error) {
    console.error("Failed to complete refund:", error);
    throw error;
  }
}

/**
 * 반납 수령 완료 가능 여부 확인
 */
export function canReceiveReturn(
  reservation: Reservation,
  isPostOwner: boolean,
): boolean {
  return (
    isPostOwner &&
    (reservation.status === ReservationStatus.RETURNING ||
      (reservation.status === ReservationStatus.PENDING_RETURN &&
        reservation.returnMethod === ReceiveMethod.DIRECT))
  );
}

/**
 * 반납 검수 완료 가능 여부 확인
 */
export function canCompleteReturnInspection(
  reservation: Reservation,
  isPostOwner: boolean,
): boolean {
  return (
    isPostOwner && reservation.status === ReservationStatus.INSPECTING_RETURN
  );
}

/**
 * 환급 요청 가능 여부 확인
 */
export function canRequestRefund(
  reservation: Reservation,
  isPostOwner: boolean,
): boolean {
  return (
    isPostOwner && reservation.status === ReservationStatus.RETURN_COMPLETED
  );
}

/**
 * 환급 완료 가능 여부 확인
 */
export function canCompleteRefund(
  reservation: Reservation,
  isPostOwner: boolean,
): boolean {
  return (
    isPostOwner && reservation.status === ReservationStatus.PENDING_REFUND
  );
}

/**
 * 예약 대여 기간 계산 (날짜만 추출하여 계산, 시간 부분 제거)
 * @param reservationStartAt 예약 시작일 (Date | string | null)
 * @param reservationEndAt 예약 종료일 (Date | string | null)
 * @returns 대여 기간 (일 수), 계산 불가능하면 0
 */
export function calculateReservationDays(
  reservationStartAt: Date | string | null | undefined,
  reservationEndAt: Date | string | null | undefined,
): number {
  if (!reservationStartAt || !reservationEndAt) {
    return 0;
  }

  const startDate = new Date(
    typeof reservationStartAt === "string"
      ? reservationStartAt
      : reservationStartAt,
  );
  const endDate = new Date(
    typeof reservationEndAt === "string" ? reservationEndAt : reservationEndAt,
  );

  // 날짜만 추출하여 계산 (시간 부분 제거)
  const startDateOnly = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  const endDateOnly = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );

  return differenceInDays(endDateOnly, startDateOnly) + 1;
}

/**
 * 예약 옵션 타입 (계산용)
 */
export interface ReservationOptionForCalculation {
  id: number;
  name: string;
  fee: number;
  deposit: number;
}

/**
 * 예약 금액 계산 결과
 */
export interface ReservationAmountCalculation {
  baseFee: number; // 기본 대여료
  baseDeposit: number; // 기본 보증금
  rentalFee: number; // 대여료 (기본 대여료 * 일수)
  optionsFee: number; // 옵션 대여료 합계 (옵션 대여료 * 일수)
  optionsDeposit: number; // 옵션 보증금 합계
  totalRentalFee: number; // 총 대여료 (rentalFee + optionsFee)
  totalDeposit: number; // 총 보증금 (baseDeposit + optionsDeposit)
  totalAmount: number; // 총 금액 (totalRentalFee + totalDeposit)
}

/**
 * 예약 금액 계산
 * @param post 게시글 정보 (fee, deposit 포함)
 * @param options 예약 옵션 목록 (fee, deposit 포함)
 * @param days 대여 기간 (일 수)
 * @returns 계산된 금액 정보
 */
export function calculateReservationAmount(
  post: { fee?: number; deposit?: number } | null | undefined,
  options: ReservationOptionForCalculation[],
  days: number,
): ReservationAmountCalculation {
  const baseFee = post?.fee || 0;
  const baseDeposit = post?.deposit || 0;
  const rentalFee = baseFee * days;
  const optionsFee = options.reduce(
    (sum, opt) => sum + (opt.fee || 0) * days,
    0,
  );
  const optionsDeposit = options.reduce(
    (sum, opt) => sum + (opt.deposit || 0),
    0,
  );
  const totalRentalFee = rentalFee + optionsFee;
  const totalDeposit = baseDeposit + optionsDeposit;
  const totalAmount = totalRentalFee + totalDeposit;

  return {
    baseFee,
    baseDeposit,
    rentalFee,
    optionsFee,
    optionsDeposit,
    totalRentalFee,
    totalDeposit,
    totalAmount,
  };
}

