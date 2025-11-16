"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ANONYMOUS,
  loadTossPayments,
  type TossPaymentsWidgets,
} from "@tosspayments/tosspayments-sdk";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useReservationQuery } from "@/queries/reservation";

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

export default function TossWidgetsPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = Number(params.reservationId);

  const { data: reservation } = useReservationQuery(reservationId);

  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reservation) return;
    if (!clientKey) {
      setError("Toss Payments client key가 설정되지 않았습니다.");
      setLoading(false);
      return;
    }

    const amount = reservation.totalAmount ?? 0;
    if (amount <= 0) {
      setError("결제 금액이 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const tossPayments = await loadTossPayments(clientKey);

        // 토스 가이드에 맞게 고객키 설정
        // - 회원 예약: "user-{id}" 형식 (2자 이상)
        // - 게스트/값이 없을 때: ANONYMOUS 상수 사용
        const rawCustomerId =
          reservation.author?.id ?? reservation.authorId ?? null;

        const widgets = tossPayments.widgets({
          customerKey:
            rawCustomerId != null
              ? `user-${String(rawCustomerId)}`
              : ANONYMOUS,
        });

        if (cancelled) return;

        widgetsRef.current = widgets;

        // 결제 금액을 먼저 설정 (공식 가이드에서 render 이전 setAmount 권장)
        await widgets.setAmount({
          currency: "KRW",
          value: amount,
        });

        await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#payment-method",
            variantKey: "DEFAULT",
          }),
          widgets.renderAgreement({
            selector: "#agreement",
            variantKey: "AGREEMENT",
          }),
        ]);

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize Toss Payments widgets:", err);
        if (!cancelled) {
          setError("결제 위젯을 초기화하지 못했습니다.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reservation]);

  const handleRequestPayment = async () => {
    if (!reservation || !widgetsRef.current) return;

    const amount = reservation.totalAmount ?? 0;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const orderId = `reservation-${reservation.id}-${Date.now()}`;
    const orderName = reservation.post?.title ?? "장비 대여 결제";

    try {
      await widgetsRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${origin}/payments/toss/success?reservationId=${reservation.id}&orderId=${orderId}&amount=${amount}`,
        failUrl: `${origin}/payments/toss/fail?reservationId=${reservation.id}&orderId=${orderId}`,
      });
    } catch (err) {
      console.error("Toss requestPayment error:", err);
      // 사용자가 창을 닫는 등의 경우가 있으므로, 여기서는 토스트만 표시하면 됨
    }
  };

  if (!reservation) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-gray-500">예약 정보를 찾을 수 없습니다.</p>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => router.push("/profile/reservations")}>
            내 예약 목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">결제하기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-1">예약 정보</p>
            <p className="font-semibold text-gray-900">
              {reservation.post?.title ?? "장비 대여"}
            </p>
            <p className="mt-2 text-sm text-gray-600 flex justify-between">
              <span>총 결제 금액</span>
              <span className="font-bold text-blue-600">
                {(reservation.totalAmount ?? 0).toLocaleString()}원
              </span>
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium mb-2">결제 수단 선택</h2>
              <div id="payment-method" className="border rounded-lg p-3 min-h-[120px]" />
            </div>

            <div>
              <h2 className="text-sm font-medium mb-2">약관 동의</h2>
              <div id="agreement" className="border rounded-lg p-3 min-h-[80px]" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push(`/reservations/${reservation.id}`)}
            >
              돌아가기
            </Button>
            <Button
              className="flex-1"
              onClick={handleRequestPayment}
              disabled={loading || !!error}
            >
              {loading ? "결제창 준비 중..." : "결제하기"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


