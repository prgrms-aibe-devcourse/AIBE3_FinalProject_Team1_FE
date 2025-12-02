"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ANONYMOUS,
  loadTossPayments,
  type TossPaymentsWidgets,
} from "@tosspayments/tosspayments-sdk";
import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useReservationQuery } from "@/queries/reservation";
import { usePostQuery } from "@/queries/post";
import {
  calculateReservationAmount,
  calculateReservationDays,
  type ReservationOptionForCalculation,
} from "@/lib/utils/reservation";

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

export default function TossWidgetsPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = Number(params.reservationId);

  const { data: reservation } = useReservationQuery(reservationId);
  const { data: post } = usePostQuery(reservation?.postId || 0);

  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 대여 기간 계산 (공통 유틸 사용)
  const daysDiff = calculateReservationDays(
    reservation?.reservationStartAt,
    reservation?.reservationEndAt,
  );

  // 옵션 목록 (예약에는 id와 이름만 있고, 가격은 post의 options에서 가져옴)
  const reservationOptions =
    reservation?.options?.map((ro) => ({
      id: ro.optionId || ro.id,
      name: ro.option?.name || `옵션 #${ro.optionId || ro.id}`,
    })) ||
    (reservation?.option?.map((opt: unknown, index: number) => {
      if (
        opt &&
        typeof opt === "object" &&
        ("name" in opt || "id" in opt)
      ) {
        return {
          id: ("id" in opt && typeof opt.id === "number" ? opt.id : null) || index,
          name: ("name" in opt && typeof opt.name === "string" ? opt.name : `옵션 #${index}`) || `옵션 #${index}`,
        };
      }
      return null;
    }).filter(Boolean) as Array<{ id: number; name: string }>) ||
    [];

  // post의 options에서 가격 정보를 가져와서 매칭
  const options: ReservationOptionForCalculation[] = reservationOptions.map(
    (resOpt) => {
      const postOption = post?.options?.find((po) => po.id === resOpt.id);
      return {
        id: resOpt.id,
        name: resOpt.name,
        fee: postOption?.fee || 0,
        deposit: postOption?.deposit || 0,
      };
    },
  );

  // 결제 금액 계산 (공통 유틸 사용)
  const amountCalc = calculateReservationAmount(post, options, daysDiff);
  const {
    totalRentalFee,
    totalDeposit,
    totalAmount,
  } = amountCalc;

  useEffect(() => {
    if (!reservation || !post) return;
    if (!clientKey) {
      setError("Toss Payments client key가 설정되지 않았습니다.");
      setLoading(false);
      return;
    }

    // 계산된 총 금액 사용 (post 정보가 필요하므로 post가 로드된 후에만 실행)
    const amount = totalAmount;
    // 0원인 경우 프론트엔드에서 성공 처리 (성공 페이지로 리다이렉트)
    if (amount <= 0) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const orderId = `reservation-${reservation.id}-${Date.now()}`;
      const successUrl = `${origin}/payments/toss/success?reservationId=${reservation.id}&orderId=${orderId}&amount=0`;
      window.location.href = successUrl;
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
  }, [reservation, post, totalAmount]);

  const handleRequestPayment = async () => {
    if (!reservation || !widgetsRef.current) return;

    const amount = totalAmount;
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
              {reservation.post?.title ?? post?.title ?? "장비 대여"}
            </p>
          </div>

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
                <span className="text-gray-600">
                  대여료 ({daysDiff}일)
                </span>
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


