"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

import type { Reservation } from "@/types/domain";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

/**
 * 예약 결제 요청 (토스페이먼츠)
 * - 결제 수단은 우선 카드로 고정
 * - 성공/실패 페이지는 /payments/toss/success, /payments/toss/fail 로 이동
 */
export async function requestReservationPayment(
  reservation: Reservation,
  amount: number,
) {
  if (!TOSS_CLIENT_KEY) {
    throw new Error("Toss Payments client key가 설정되지 않았습니다.");
  }

  const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

  const orderId = `reservation-${reservation.id}-${Date.now()}`;
  const orderName = reservation.post?.title ?? "장비 대여 결제";

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const successUrl = `${origin}/payments/toss/success?reservationId=${reservation.id}&orderId=${orderId}&amount=${amount}`;
  const failUrl = `${origin}/payments/toss/fail?reservationId=${reservation.id}&orderId=${orderId}`;

  // 최신 SDK에서는 widgets 기반 결제를 권장하지만,
  // 이 헬퍼는 simple requestPayment 래퍼로 남겨둡니다.
  // TossPayments SDK 타입이 최신 사양을 모두 반영하지 않아 일시적으로 unknown 캐스팅을 사용합니다.
  const legacyClient = tossPayments as unknown as {
    requestPayment: (
      method: string,
      options: {
        amount: number;
        orderId: string;
        orderName: string;
        successUrl: string;
        failUrl: string;
      },
    ) => Promise<void>;
  };

  await legacyClient.requestPayment("카드", {
    amount,
    orderId,
    orderName,
    successUrl,
    failUrl,
  });
}
