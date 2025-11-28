/**
 * 신고 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, PaginatedApiResponse } from "@/types/api";
import type { CreateReportDto, Report, ReportType } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  banReportTarget,
  createReport,
  getMyReports,
  getReport,
  getReportList,
  getReportsByType,
  unbanReportTarget,
} from "@/api/endpoints/report";

import { useUIStore } from "@/store/uiStore";

/**
 * 신고 목록 조회 query (관리자용)
 */
export function useReportListQuery(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.report.list(filters)),
    queryFn: async (): Promise<Report[] | PaginatedApiResponse<Report>> => {
      return getReportList(filters);
    },
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
  });
}

/**
 * 신고 상세 조회 query (관리자용)
 */
export function useReportQuery(reportId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.report.detail(reportId)),
    queryFn: async (): Promise<Report> => {
      const response = await getReport(reportId);
      return response;
    },
    enabled: !!reportId, // reportId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
  });
}

/**
 * 타입별 신고 목록 조회 query (관리자용)
 */
export function useReportsByTypeQuery(
  reportType: ReportType,
  filters?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.report.list({ ...filters, reportType })),
    queryFn: async (): Promise<PaginatedApiResponse<Report>> => {
      return getReportsByType(reportType, filters);
    },
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
  });
}

/**
 * 내 신고 목록 조회 query
 */
export function useMyReportsQuery(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.report.list(filters)),
    queryFn: async (): Promise<PaginatedApiResponse<Report>> => {
      return getMyReports(filters);
    },
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
  });
}

/**
 * 신고 생성 mutation
 */
export function useCreateReportMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (data: CreateReportDto) => createReport(data),
    onSuccess: () => {
      // 신고 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.report.all),
      });
      // 내 신고 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.report.list({})),
      });
      showToast("신고가 접수되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Create report error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "신고 접수에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 신고 대상 제재 mutation (관리자용)
 */
export function useBanReportTargetMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({
      reportType,
      targetId,
    }: {
      reportType: ReportType;
      targetId: number;
    }) => banReportTarget(reportType, targetId),
    onSuccess: () => {
      // 신고 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.report.all),
      });
      showToast("제재가 적용되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Ban report target error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "제재 적용에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 신고 대상 제재 해제 mutation (관리자용)
 */
export function useUnbanReportTargetMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({
      reportType,
      targetId,
    }: {
      reportType: ReportType;
      targetId: number;
    }) => unbanReportTarget(reportType, targetId),
    onSuccess: () => {
      // 신고 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.report.all),
      });
      showToast("제재가 해제되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Unban report target error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "제재 해제에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}
