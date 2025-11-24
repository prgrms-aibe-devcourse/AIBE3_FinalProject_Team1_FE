/**
 * 관리자 신고 목록 페이지
 */
"use client";

import { useState } from "react";
import { Flag, Trash2, Info, Clock, AlertCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";

import { ReportType } from "@/types/domain";

import { useReportListQuery } from "@/queries/report";
import { useDeleteReportMutation } from "@/queries/report";

import { parseLocalDateString } from "@/lib/utils";

const PAGE_SIZE = 10;

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.POST]: "게시글",
  [ReportType.MEMBER]: "사용자",
  [ReportType.REVIEW]: "리뷰",
};

const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  [ReportType.POST]: "bg-blue-100 text-blue-800",
  [ReportType.MEMBER]: "bg-green-100 text-green-800",
  [ReportType.REVIEW]: "bg-yellow-100 text-yellow-800",
};

type TabType = "all" | ReportType;

const REPORT_TABS: { type: TabType; label: string }[] = [
  { type: "all", label: "전체" },
  { type: ReportType.POST, label: "게시글" },
  { type: ReportType.MEMBER, label: "사용자" },
  { type: ReportType.REVIEW, label: "리뷰" },
];

export default function AdminReportsPage() {
  const [selectedTab, setSelectedTab] = useState<TabType>("all");
  const [page, setPage] = useState(0);

  // 필터 구성
  const filters: Record<string, unknown> = {
    page,
    size: PAGE_SIZE,
  };
  if (selectedTab !== "all") {
    filters.reportType = selectedTab;
  }

  const { data: reportsData, isLoading } = useReportListQuery(filters);
  const deleteMutation = useDeleteReportMutation();

  const reports = reportsData && "content" in reportsData ? reportsData.content : [];
  const totalPages =
    reportsData && "page" in reportsData
      ? reportsData.page.totalPages
      : 1;
  const totalElements =
    reportsData && "page" in reportsData
      ? reportsData.page.totalElements
      : 0;

  // 임시 Summary 데이터
  const summaryData = {
    total: totalElements,
    pending: Math.floor(totalElements * 0.3), // 임시: 전체의 30%
    sanctioned: Math.floor(totalElements * 0.2), // 임시: 전체의 20%
    rejected: Math.floor(totalElements * 0.1), // 임시: 전체의 10%
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteMutation.mutateAsync(reportId);
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const handleTabChange = (type: TabType) => {
    setSelectedTab(type);
    setPage(0); // 탭 변경 시 첫 페이지로 리셋
  };

  const formatDateTime = (date: string | Date) => {
    const dateObj = typeof date === "string" ? parseLocalDateString(date) : date;
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const hh = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const getIndex = (currentPage: number, currentIndex: number) => {
    return currentPage * PAGE_SIZE + currentIndex + 1;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">신고 관리</h2>
        <p className="text-sm text-gray-600 mt-1">
          모든 신고를 검토하고 처리할 수 있습니다.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 신고</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summaryData.total}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">대기 중</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summaryData.pending}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">제재 완료</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summaryData.sanctioned}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">반려</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summaryData.rejected}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.type}
              onClick={() => handleTabChange(tab.type)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedTab === tab.type
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 테이블 */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  신고 대상
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  신고자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  신고일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사유
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">신고가 없습니다.</p>
                  </td>
                </tr>
              ) : (
                reports.map((report, index) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getIndex(page, index)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          REPORT_TYPE_COLORS[report.reportType]
                        }`}
                      >
                        {REPORT_TYPE_LABELS[report.reportType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ID: {report.targetId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ID: {(report as { authorId?: number }).authorId ?? report.memberId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.createdAt ? formatDateTime(report.createdAt) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={report.comment}>
                        {report.comment}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(report.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        삭제
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-center">
              <Pagination
                currentPage={page + 1}
                totalPages={totalPages}
                onPageChange={(newPage) => setPage(newPage - 1)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
