"use client";

import { useState } from "react";

import Image from "next/image";

import type { MemberResponse } from "@/types/domain";
import { ReportType } from "@/types/domain";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";

import { ReportDialog } from "@/components/report/report-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useReviewsByMemberQuery } from "@/queries/review";
import {
  useMemberReviewAISummaryQuery,
  useReviewSummaryQuery,
  useUserQuery,
} from "@/queries/user";
import { parseLocalDateString } from "@/lib/utils";

import { useAuthStore } from "@/store/authStore";

import { ChevronDown, ChevronUp, Flag, Sparkles, Star } from "lucide-react";

type ProfileReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  author?: MemberResponse | null;
  memberId?: number | null;
};

export function ProfileReviewDialog({
  open,
  onOpenChange,
  author,
  memberId,
}: ProfileReviewDialogProps) {
  const [page, setPage] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reviewReportDialogOpen, setReviewReportDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<{
    id: number;
    comment: string;
  } | null>(null);
  const [isAISummaryExpanded, setIsAISummaryExpanded] = useState(true);
  const pageSize = 5;
  const { user } = useAuthStore();

  const effectiveMemberId = memberId ?? author?.id ?? null;
  const { data: member } = useUserQuery(
    effectiveMemberId ?? undefined,
  );

  const { data: reviewSummary } = useReviewSummaryQuery(
    effectiveMemberId ?? undefined,
  );
  const { data: aiSummary, isLoading: isAISummaryLoading } =
    useMemberReviewAISummaryQuery(effectiveMemberId ?? undefined);

  const { data: reviewsData, isLoading } = useReviewsByMemberQuery(
    effectiveMemberId ?? 0,
    {
      page: page,
      size: pageSize,
    },
  );

  const reviews = reviewsData?.content || [];
  const totalPages = reviewsData?.page?.totalPages || 1;

  // 우선순위: member(회원 조회) > author(게시글 응답)
  const baseMember = member ?? author ?? null;

  const displayName =
    baseMember?.nickname ||
    baseMember?.name ||
    "익명";

  // 자기 자신인지 확인
  const isSelf = user?.id === effectiveMemberId;

  const createdAt = baseMember?.createdAt;

  const joinedAtText =
    createdAt != null
      ? (() => {
          const date = parseLocalDateString(createdAt);
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, "0");
          const dd = String(date.getDate()).padStart(2, "0");
          return `가입일: ${yyyy}-${mm}-${dd}`;
        })()
      : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>프로필</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-6 flex flex-col max-h-[80vh]">
          {/* 프로필 상단 요약 */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200 flex-shrink-0">
            <div className="relative h-16 w-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {author?.profileImgUrl ? (
                <Image
                  src={author.profileImgUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-xl font-semibold text-gray-600">
                  {displayName[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-gray-900">
                {displayName}
              </p>
              {reviewSummary && (
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="flex items-center gap-0.5 text-yellow-500">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-gray-900">
                        {reviewSummary.avgScore.toFixed(1)}
                      </span>
                    </span>
                    {reviewSummary.count > 0 && (
                      <span className="text-gray-500 text-xs">
                        ({reviewSummary.count}개 후기)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      장비
                      <span className="flex items-center gap-0.5 text-yellow-500">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{reviewSummary.equipmentScore.toFixed(1)}</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      친절도
                      <span className="flex items-center gap-0.5 text-yellow-500">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{reviewSummary.kindnessScore.toFixed(1)}</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      응답시간
                      <span className="flex items-center gap-0.5 text-yellow-500">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{reviewSummary.responseTimeScore.toFixed(1)}</span>
                      </span>
                    </span>
                  </div>
                </div>
              )}
              {joinedAtText && (
                <p className="mt-1 text-xs text-gray-500">{joinedAtText}</p>
              )}
            </div>
          </div>

          {/* 후기 목록 */}
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex-shrink-0">
              후기
            </h3>
            {/* AI 후기 요약 */}
            {isAISummaryLoading ? (
              <div className="mb-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-4 border border-blue-100 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                  <h4 className="text-base font-semibold text-gray-900">
                    AI 후기 요약
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" />
                  <div
                    className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                  <p className="ml-2 text-sm">AI 후기 요약 생성중입니다...</p>
                </div>
              </div>
            ) : aiSummary &&
              aiSummary.trim() &&
              aiSummary.trim() !== "후기가 없습니다." ? (
              <div className="mb-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-4 border border-blue-100 flex-shrink-0">
                <button
                  onClick={() => setIsAISummaryExpanded(!isAISummaryExpanded)}
                  className="w-full flex items-center justify-between gap-2 mb-3 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h4 className="text-base font-semibold text-gray-900">
                      AI 후기 요약
                    </h4>
                  </div>
                  {isAISummaryExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                {isAISummaryExpanded && (
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">
                    {aiSummary}
                  </p>
                )}
              </div>
            ) : null}
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
              {isLoading ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  후기를 불러오는 중입니다...
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  아직 받은 후기가 없습니다.
                </div>
              ) : (
                reviews.map((review) => {
                const overallScore =
                  (review.equipmentScore +
                    review.kindnessScore +
                    review.responseTimeScore) /
                  3;
                return (
                  <div
                    key={review.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative"
                  >
                    {/* 신고하기 버튼 - 우측 상단 */}
                    {user && (
                      <div className="absolute top-4 right-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReview({
                                      id: review.id,
                                      comment: review.comment,
                                    });
                                    setReviewReportDialogOpen(true);
                                  }}
                                  disabled={user.id === review.author?.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Flag className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {user.id === review.author?.id ? (
                              <TooltipContent>
                                <p>자신의 후기는 신고할 수 없습니다.</p>
                              </TooltipContent>
                            ) : (
                              <TooltipContent>
                                <p>신고하기</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}

                    {/* 작성자 닉네임과 작성일 */}
                    <div className="flex items-center gap-2 mb-2 pr-16">
                      <span className="font-semibold text-sm text-gray-900">
                        {review.author?.nickname || "익명"}
                      </span>
                      {review.createdAt && (
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const date = parseLocalDateString(review.createdAt);
                            const yyyy = date.getFullYear();
                            const mm = String(
                              date.getMonth() + 1,
                            ).padStart(2, "0");
                            const dd = String(date.getDate()).padStart(2, "0");
                            return `${yyyy}-${mm}-${dd}`;
                          })()}
                        </span>
                      )}
                    </div>

                    {/* 평균 평점, 장비, 친절도, 응답시간 - 한 줄 */}
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">
                          {overallScore.toFixed(1)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        장비
                        <span className="flex items-center gap-0.5 text-yellow-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{review.equipmentScore}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        친절도
                        <span className="flex items-center gap-0.5 text-yellow-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{review.kindnessScore}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        응답시간
                        <span className="flex items-center gap-0.5 text-yellow-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{review.responseTimeScore}</span>
                        </span>
                      </span>
                    </div>

                    {/* 후기 내용 */}
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  </div>
                );
              })
              )}
              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="pt-2 flex justify-center flex-shrink-0">
                  <Pagination
                    currentPage={page + 1}
                    totalPages={totalPages}
                    onPageChange={(newPage) => setPage(newPage - 1)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 flex-shrink-0">
            {effectiveMemberId && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        onClick={() => setReportDialogOpen(true)}
                        disabled={isSelf}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        신고하기
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {isSelf && (
                    <TooltipContent>
                      <p>자신은 신고할 수 없습니다.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* 사용자 신고 다이얼로그 */}
      {effectiveMemberId && (
        <ReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          reportType={ReportType.MEMBER}
          targetId={effectiveMemberId}
          targetTitle={displayName}
        />
      )}

      {/* 후기 신고 다이얼로그 */}
      {selectedReview && (
        <ReportDialog
          open={reviewReportDialogOpen}
          onOpenChange={(open) => {
            setReviewReportDialogOpen(open);
            if (!open) {
              setSelectedReview(null);
            }
          }}
          reportType={ReportType.REVIEW}
          targetId={selectedReview.id}
          targetTitle={`후기: ${selectedReview.comment.substring(0, 30)}${selectedReview.comment.length > 30 ? "..." : ""}`}
        />
      )}
    </Dialog>
  );
}


