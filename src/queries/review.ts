/**
 * 후기 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, PaginatedApiResponse } from "@/types/api";
import type { CreateReviewDto, Review, UpdateReviewDto } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  createReview,
  deleteReview,
  getReview,
  getReviewByReservation,
  getReviewList,
  getReviewsByMember,
  getReviewsByPost,
  updateReview,
} from "@/api/endpoints/review";

import { useUIStore } from "@/store/uiStore";

/**
 * 후기 목록 조회 query
 */
export function useReviewListQuery(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.review.all),
    queryFn: async (): Promise<PaginatedApiResponse<Review>> => {
      return getReviewList(filters);
    },
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
  });
}

/**
 * 후기 상세 조회 query
 */
export function useReviewQuery(reviewId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.review.detail(reviewId)),
    queryFn: async (): Promise<Review> => {
      const response = await getReview(reviewId);
      return response;
    },
    enabled: !!reviewId, // reviewId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
  });
}

/**
 * 게시글별 후기 목록 조회 query
 */
export function useReviewsByPostQuery(
  postId: number,
  filters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.review.byPost(postId)),
    queryFn: async (): Promise<PaginatedApiResponse<Review>> => {
      try {
        return await getReviewsByPost(postId, filters);
      } catch (error) {
        // API 실패 시 빈 페이지네이션 응답 반환하여 정상 동작
        console.error("Failed to fetch reviews by post:", error);
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
    enabled: !!postId, // postId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
    retry: false, // 재시도하지 않음
  });
}

/**
 * 회원별 후기 목록 조회 query
 */
export function useReviewsByMemberQuery(
  memberId: number,
  filters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.review.byMember(memberId)),
    queryFn: async (): Promise<PaginatedApiResponse<Review>> => {
      return getReviewsByMember(memberId, filters);
    },
    enabled: !!memberId, // memberId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
  });
}

/**
 * 예약별 후기 조회 query
 */
export function useReviewByReservationQuery(reservationId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.review.byReservation(reservationId)),
    queryFn: async (): Promise<Review | null> => {
      const response = await getReviewByReservation(reservationId);
      return response;
    },
    enabled: !!reservationId, // reservationId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
  });
}

/**
 * 후기 생성 mutation
 */
export function useCreateReviewMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (data: CreateReviewDto) => createReview(data),
    onSuccess: (response) => {
      // 후기 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.review.all),
      });
      // 게시글별 후기 목록 무효화
      if (response.reservation?.postId) {
        queryClient.invalidateQueries({
          queryKey: getQueryKey(
            queryKeys.review.byPost(response.reservation.postId),
          ),
        });
        // 게시글 상세 쿼리 무효화 (후기 수 변경)
        queryClient.invalidateQueries({
          queryKey: getQueryKey(
            queryKeys.post.detail(response.reservation.postId),
          ),
        });
      }
      // 예약별 후기 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.review.byReservation(response.reservationId)),
        response,
      );
      // 예약 상세 쿼리 무효화 (후기 추가)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(
          queryKeys.reservation.detail(response.reservationId),
        ),
      });
      showToast("후기가 생성되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Create review error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "후기 생성에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 후기 수정 mutation
 */
export function useUpdateReviewMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: number;
      data: UpdateReviewDto;
    }) => updateReview(reviewId, data),
    onSuccess: (response, variables) => {
      // 후기 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.review.detail(variables.reviewId)),
        response,
      );
      // 후기 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.review.all),
      });
      // 게시글별 후기 목록 무효화
      if (response.reservation?.postId) {
        queryClient.invalidateQueries({
          queryKey: getQueryKey(
            queryKeys.review.byPost(response.reservation.postId),
          ),
        });
      }
      showToast("후기가 수정되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Update review error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "후기 수정에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 후기 삭제 mutation
 */
export function useDeleteReviewMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (reviewId: number) => deleteReview(reviewId),
    onSuccess: (_, reviewId) => {
      // 후기 상세 쿼리 제거
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.review.detail(reviewId)),
      });
      // 후기 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.review.all),
      });
      showToast("후기가 삭제되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Delete review error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "후기 삭제에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}
