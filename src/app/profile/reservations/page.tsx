/**
 * 마이페이지 - 내 예약
 */
"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";

import Link from "next/link";

import type { Reservation } from "@/types/domain";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useMyReservationsQuery } from "@/queries/reservation";

/**
 * 마이페이지 - 내 예약
 */

/**
 * 마이페이지 - 내 예약
 */

/**
 * 마이페이지 - 내 예약
 */

/**
 * 마이페이지 - 내 예약
 */

/**
 * 마이페이지 - 내 예약
 */

/**
 * 마이페이지 - 내 예약
 */

/**
 * 마이페이지 - 내 예약
 */

/**
 * 마이페이지 - 내 예약
 */

/**
 * 마이페이지 - 내 예약
 */

/**
 * 마이페이지 - 내 예약
 */

/**
 * 마이페이지 - 내 예약
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

export default function MyReservationsPage() {
  const { data: myReservations, isLoading: reservationsLoading } =
    useMyReservationsQuery();

  if (reservationsLoading) {
    return (
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
    );
  }

  const reservations = Array.isArray(myReservations)
    ? myReservations
    : myReservations?.content || [];

  return (
    <div className="p-0">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">내 예약</h1>
      {reservations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">예약 내역이 없습니다.</p>
            <Link href="/posts">
              <Button>게시글 보기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation: Reservation) => (
            <Link key={reservation.id} href={`/reservations/${reservation.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          예약 #{reservation.id}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
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
                          {format(
                            new Date(reservation.reservationStartAt),
                            "yyyy. MM. dd.",
                            { locale: ko },
                          )}{" "}
                          ~{" "}
                          {reservation.reservationEndAt
                            ? format(
                                new Date(reservation.reservationEndAt),
                                "yyyy. MM. dd.",
                                { locale: ko },
                              )
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
