/**
 * 예약 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type {
  CreateReservationDto,
  Reservation,
  ReservationStatus,
  UpdateReservationDto,
} from "@/types/domain";

import { buildQueryParams } from "@/lib/utils/api-params";

import { apiClient } from "@/api/client";

/**
 * 예약 목록 조회
 */
export async function getReservationList(
  filters?: Record<string, unknown>,
): Promise<Reservation[] | PaginatedApiResponse<Reservation>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/reservations${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<Reservation[] | PaginatedApiResponse<Reservation>>(
    endpoint,
  );
}

/**
 * 예약 상세 조회
 */
export async function getReservation(
  reservationId: number,
): Promise<Reservation> {
  return apiClient.get<Reservation>(`/api/v1/reservations/${reservationId}`);
}

/**
 * 예약 생성
 */
export async function createReservation(
  data: CreateReservationDto,
): Promise<Reservation> {
  return apiClient.post<Reservation>("/api/v1/reservations", data);
}

/**
 * 예약 수정
 */
export async function updateReservation(
  reservationId: number,
  data: UpdateReservationDto,
): Promise<Reservation> {
  return apiClient.put<Reservation>(
    `/api/v1/reservations/${reservationId}`,
    data,
  );
}

/**
 * 예약 삭제
 */
export async function deleteReservation(reservationId: number): Promise<void> {
  return apiClient.delete<void>(`/api/v1/reservations/${reservationId}`);
}

/**
 * 내가 신청한 예약 목록 조회
 */
export async function getMyReservations(
  filters?: Record<string, unknown>,
): Promise<PaginatedApiResponse<Reservation>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/reservations/sent${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Reservation>>(endpoint);
}

/**
 * 게시글별 예약 목록 조회
 */
export async function getReservationsByPost(
  postId: number,
  filters?: Record<string, unknown>,
): Promise<Reservation[] | PaginatedApiResponse<Reservation>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/reservations/received/${postId}${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<Reservation[] | PaginatedApiResponse<Reservation>>(
    endpoint,
  );
}

/**
 * 예약 승인
 */
export async function approveReservation(
  reservationId: number,
): Promise<Reservation> {
  return apiClient.put<Reservation>(
    `/api/v1/reservations/${reservationId}/approve`,
    {},
  );
}

/**
 * 예약 거절
 */
export async function rejectReservation(
  reservationId: number,
  reason: string,
): Promise<Reservation> {
  return apiClient.put<Reservation>(
    `/api/v1/reservations/${reservationId}/reject`,
    {
      rejectReason: reason,
    },
  );
}

/**
 * 예약 취소
 */
export async function cancelReservation(
  reservationId: number,
  reason?: string,
): Promise<Reservation> {
  return apiClient.put<Reservation>(
    `/api/v1/reservations/${reservationId}/cancel`,
    {
      cancelReason: reason,
    },
  );
}

/**
 * 상태별 예약 목록 조회
 */
export async function getReservationsByStatus(
  status: ReservationStatus,
  filters?: Record<string, unknown>,
): Promise<Reservation[] | PaginatedApiResponse<Reservation>> {
  const params = buildQueryParams(filters);
  params.append("status", status);
  const endpoint = `/api/v1/reservations${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<Reservation[] | PaginatedApiResponse<Reservation>>(
    endpoint,
  );
}
