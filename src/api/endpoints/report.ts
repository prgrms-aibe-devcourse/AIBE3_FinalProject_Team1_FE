/**
 * 신고 관련 API 엔드포인트
 */
import type { PaginatedApiResponse } from "@/types/api";
import type { CreateReportDto, Report } from "@/types/domain";
import { ReportType } from "@/types/domain";

import { buildQueryParams } from "@/lib/utils/api-params";

import { apiClient } from "@/api/client";

import { banPostByAdmin, unbanPostByAdmin } from "./post";
import { banReviewByAdmin, unbanReviewByAdmin } from "./review";
import { banUserByAdmin, unbanUserByAdmin } from "./user";

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

/**
 * 신고 타입에 따른 제재 등록
 */
export async function banReportTarget(
  reportType: ReportType,
  targetId: number,
): Promise<void> {
  switch (reportType) {
    case ReportType.MEMBER:
      return banUserByAdmin(targetId);
    case ReportType.POST:
      return banPostByAdmin(targetId);
    case ReportType.REVIEW:
      return banReviewByAdmin(targetId);
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
}

/**
 * 신고 타입에 따른 제재 해제
 */
export async function unbanReportTarget(
  reportType: ReportType,
  targetId: number,
): Promise<void> {
  switch (reportType) {
    case ReportType.MEMBER:
      return unbanUserByAdmin(targetId);
    case ReportType.POST:
      return unbanPostByAdmin(targetId);
    case ReportType.REVIEW:
      return unbanReviewByAdmin(targetId);
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
}
