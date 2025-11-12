/**
 * 예약 목록 페이지
 */
"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useMyReservationsQuery } from "@/queries/reservation";

/**
 * 예약 목록 페이지
 */

/**
 * 예약 목록 페이지
 */

/**
 * 예약 목록 페이지
 */

/**
 * 예약 목록 페이지
 */

/**
 * 예약 목록 페이지
 */

/**
 * 예약 목록 페이지
 */

/**
 * 예약 목록 페이지
 */

/**
 * 예약 목록 페이지
 */

/**
 * 예약 목록 페이지
 */

/**
 * 예약 목록 페이지
 */

/**
 * 예약 목록 페이지
 */

const statusLabels: Record<string, string> = {
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "거절",
  RENTED: "대여중",
  RETURNED: "반납완료",
  CANCELLED: "취소",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  RENTED: "bg-green-100 text-green-800",
  RETURNED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function ReservationsPage() {
  const { data, isLoading, error } = useMyReservationsQuery();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-red-600">
          예약 목록을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  const reservations = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">내 예약</h1>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">예약 내역이 없습니다.</p>
          <Link href="/posts">
            <Button>게시글 보기</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <Link key={reservation.id} href={`/reservations/${reservation.id}`}>
              <Card className="transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          예약 #{reservation.id}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            statusColors[reservation.status] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {statusLabels[reservation.status] ||
                            reservation.status}
                        </span>
                      </div>
                      {reservation.reservationStartAt && (
                        <p className="text-sm text-gray-600">
                          대여 기간:{" "}
                          {new Date(
                            reservation.reservationStartAt,
                          ).toLocaleDateString("ko-KR")}{" "}
                          ~{" "}
                          {reservation.reservationEndAt
                            ? new Date(
                                reservation.reservationEndAt,
                              ).toLocaleDateString("ko-KR")
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
