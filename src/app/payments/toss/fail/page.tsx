"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function TossFailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reservationId = searchParams.get("reservationId");

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-red-600">
            결제에 실패했습니다.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            결제가 정상적으로 처리되지 않았습니다. 다시 시도해 주세요.
          </p>
          <div className="flex gap-2 mt-4">
            {reservationId && (
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => router.push(`/reservations/${reservationId}`)}
              >
                예약 상세로 돌아가기
              </Button>
            )}
            <Button
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

export default function TossFailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TossFailPageContent />
    </Suspense>
  );
}
