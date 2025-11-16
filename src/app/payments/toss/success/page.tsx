"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ReservationStatus } from "@/types/domain";

import { useUpdateReservationStatusMutation } from "@/queries/reservation";

function TossSuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reservationIdParam = searchParams.get("reservationId");
  const reservationId = reservationIdParam ? Number(reservationIdParam) : null;
  const amount = searchParams.get("amount");

  const updateStatusMutation = useUpdateReservationStatusMutation();
  const hasUpdatedRef = useRef(false);

  // 결제 성공 시 예약 상태를 "수령 대기(PENDING_PICKUP)"로 변경
  useEffect(() => {
    if (!reservationId) return;
    // React StrictMode에서 useEffect가 두 번 실행되는 것을 막기 위한 ref 가드
    if (hasUpdatedRef.current) return;
    hasUpdatedRef.current = true;

    (async () => {
      try {
        await updateStatusMutation.mutateAsync({
          reservationId,
          data: {
            status: ReservationStatus.PENDING_PICKUP,
          },
        });
      } catch (error) {
        console.error("Failed to update reservation status after payment:", error);
      }
    })();
  }, [reservationId, updateStatusMutation]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">결제가 완료되었습니다.</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reservationId && (
            <p className="text-gray-700">
              예약 번호 <span className="font-semibold">#{reservationId}</span>
            </p>
          )}
          {amount && (
            <p className="text-gray-700">
              결제 금액{" "}
              <span className="font-semibold">
                {Number(amount).toLocaleString()}원
              </span>
            </p>
          )}
          <div className="flex gap-2 mt-4">
            {reservationId && (
              <Button
                className="flex-1"
                onClick={() => router.push(`/reservations/${reservationId}`)}
              >
                예약 상세로 이동
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/profile/reservations")}
            >
              내 예약 목록
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TossSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TossSuccessPageContent />
    </Suspense>
  );
}
