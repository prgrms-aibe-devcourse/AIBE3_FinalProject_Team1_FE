/**
 * 신고 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type { CreateReportDto, Report, ReportType } from "@/types/domain";

import { buildQueryParams } from "@/lib/utils/api-params";

import { apiClient } from "@/api/client";

/**
 * 신고 목록 조회 (관리자용)
 */
export async function getReportList(
  filters?: Record<string, unknown>,
): Promise<PaginatedApiResponse<Report>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/adm/reports${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Report>>(endpoint);
}

/**
 * 신고 상세 조회 (관리자용)
 */
export async function getReport(reportId: number): Promise<Report> {
  return apiClient.get<Report>(`/api/v1/reports/${reportId}`);
}

/**
 * 신고 생성
 */
export async function createReport(data: CreateReportDto): Promise<Report> {
  return apiClient.post<Report>("/api/v1/reports", data);
}

/**
 * 신고 삭제 (관리자용)
 */
export async function deleteReport(reportId: number): Promise<void> {
  return apiClient.delete<void>(`/api/v1/reports/${reportId}`);
}

/**
 * 타입별 신고 목록 조회 (관리자용)
 */
export async function getReportsByType(
  reportType: ReportType,
  filters?: Record<string, unknown>,
): Promise<PaginatedApiResponse<Report>> {
  const params = buildQueryParams(filters);
  params.append("reportType", reportType);
  const endpoint = `/api/v1/adm/reports${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Report>>(endpoint);
}

/**
 * 내 신고 목록 조회
 */
export async function getMyReports(
  filters?: Record<string, unknown>,
): Promise<PaginatedApiResponse<Report>> {
  const params = buildQueryParams(filters);
  const endpoint = `/api/v1/reports/me${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<PaginatedApiResponse<Report>>(endpoint);
}
