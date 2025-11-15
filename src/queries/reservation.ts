/**
 * 예약 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, PaginatedApiResponse } from "@/types/api";
import type {
  CreateReservationDto,
  Reservation,
  ReservationStatus,
  UpdateReservationDto,
} from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import { useUIStore } from "@/store/uiStore";

import {
  approveReservation,
  cancelReservation,
  createReservation,
  deleteReservation,
  getMyReservations,
  getReservation,
  getReservationList,
  getReservationsByPost,
  getReservationsByStatus,
  rejectReservation,
  updateReservation,
} from "@/api/endpoints/reservation";

/**
 * 예약 목록 조회 query
 */
export function useReservationListQuery(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.reservation.list(filters)),
    queryFn: async (): Promise<
      Reservation[] | PaginatedApiResponse<Reservation>
    > => {
      try {
        return await getReservationList(filters);
      } catch (error) {
        // API 실패 시 빈 배열 반환하여 정상 동작
        console.error("Failed to fetch reservation list:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
    retry: false, // 재시도하지 않음
  });
}

/**
 * 예약 상세 조회 query
 */
export function useReservationQuery(reservationId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.reservation.detail(reservationId)),
    queryFn: async (): Promise<Reservation | null> => {
      try {
        return await getReservation(reservationId);
      } catch (error) {
        // API 실패 시 null 반환하여 정상 동작
        console.error("Failed to fetch reservation:", error);
        return null;
      }
    },
    enabled: !!reservationId, // reservationId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    retry: false, // 재시도하지 않음
  });
}

/**
 * 내 예약 목록 조회 query
 */
export function useMyReservationsQuery(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.reservation.myReservations),
    queryFn: async (): Promise<PaginatedApiResponse<Reservation>> => {
      try {
        return await getMyReservations(filters);
      } catch (error) {
        // API 실패 시 빈 페이지네이션 응답 반환
        console.error("Failed to fetch my reservations:", error);
        return {
          content: [],
          page: {
            page: 0,
            size: 20,
            totalElements: 0,
            totalPages: 0,
            first: true,
            last: true,
            hasNext: false,
            hasPrevious: false,
            sort: [],
          },
        };
      }
    },
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
    retry: false, // 재시도하지 않음
  });
}

/**
 * 게시글별 예약 목록 조회 query
 */
export function useReservationsByPostQuery(
  postId: number,
  filters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.reservation.byPost(postId)),
    queryFn: async (): Promise<
      Reservation[] | PaginatedApiResponse<Reservation>
    > => {
      return getReservationsByPost(postId, filters);
    },
    enabled: !!postId, // postId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
  });
}

/**
 * 상태별 예약 목록 조회 query
 */
export function useReservationsByStatusQuery(
  status: ReservationStatus,
  filters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.reservation.byStatus(status)),
    queryFn: async (): Promise<
      Reservation[] | PaginatedApiResponse<Reservation>
    > => {
      return getReservationsByStatus(status, filters);
    },
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
  });
}

/**
 * 예약 생성 mutation
 */
export function useCreateReservationMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (data: CreateReservationDto) => createReservation(data),
    onSuccess: (response) => {
      // 예약 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.reservation.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.reservation.myReservations),
      });
      // 게시글별 예약 목록 무효화
      if (response.postId) {
        queryClient.invalidateQueries({
          queryKey: getQueryKey(queryKeys.reservation.byPost(response.postId)),
        });
      }
      // 게시글 상세 쿼리 무효화 (예약 수 변경)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.detail(response.postId)),
      });
      showToast("예약이 생성되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Create reservation error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "예약 생성에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 예약 수정 mutation
 */
export function useUpdateReservationMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({
      reservationId,
      data,
    }: {
      reservationId: number;
      data: UpdateReservationDto;
    }) => updateReservation(reservationId, data),
    onSuccess: (response, variables) => {
      // 예약 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.reservation.detail(variables.reservationId)),
        response,
      );
      // 예약 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.reservation.all),
      });
      showToast("예약이 수정되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Update reservation error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "예약 수정에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 예약 삭제 mutation
 */
export function useDeleteReservationMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (reservationId: number) => deleteReservation(reservationId),
    onSuccess: (_, reservationId) => {
      // 예약 상세 쿼리 제거
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.reservation.detail(reservationId)),
      });
      // 예약 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.reservation.all),
      });
      showToast("예약이 삭제되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Delete reservation error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "예약 삭제에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 예약 승인 mutation
 */
export function useApproveReservationMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (reservationId: number) => approveReservation(reservationId),
    onSuccess: (response, reservationId) => {
      // 예약 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.reservation.detail(reservationId)),
        response,
      );
      // 예약 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.reservation.all),
      });
      // 상태별 예약 목록 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.reservation.byStatus(response.status)),
      });
      showToast("예약이 승인되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Approve reservation error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "예약 승인에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 예약 거절 mutation
 */
export function useRejectReservationMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({
      reservationId,
      reason,
    }: {
      reservationId: number;
      reason: string;
    }) => rejectReservation(reservationId, reason),
    onSuccess: (response, variables) => {
      // 예약 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.reservation.detail(variables.reservationId)),
        response,
      );
      // 예약 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.reservation.all),
      });
      // 상태별 예약 목록 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.reservation.byStatus(response.status)),
      });
      showToast("예약이 거절되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Reject reservation error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "예약 거절에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 예약 취소 mutation
 */
export function useCancelReservationMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({
      reservationId,
      reason,
    }: {
      reservationId: number;
      reason?: string;
    }) => cancelReservation(reservationId, reason),
    onSuccess: (response, variables) => {
      // 예약 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.reservation.detail(variables.reservationId)),
        response,
      );
      // 예약 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.reservation.all),
      });
      // 상태별 예약 목록 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.reservation.byStatus(response.status)),
      });
      showToast("예약이 취소되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Cancel reservation error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "예약 취소에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}
