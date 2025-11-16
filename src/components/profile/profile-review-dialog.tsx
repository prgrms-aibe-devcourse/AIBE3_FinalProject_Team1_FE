"use client";

import { useState } from "react";

import Image from "next/image";

import type { MemberResponse } from "@/types/domain";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";

import { useReviewsByMemberQuery } from "@/queries/review";
import { useUserQuery } from "@/queries/user";

import { Star } from "lucide-react";

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
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const effectiveMemberId = memberId ?? author?.id ?? null;
  const { data: member } = useUserQuery(
    effectiveMemberId ?? undefined,
  );

  const { data: reviewsData, isLoading } = useReviewsByMemberQuery(
    effectiveMemberId ?? 0,
    {
      page: page - 1,
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

  const createdAt = baseMember?.createdAt;

  const joinedAtText =
    createdAt != null
      ? (() => {
          const date = new Date(createdAt);
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

        <div className="p-4 space-y-6">
          {/* 프로필 상단 요약 */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
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
              {joinedAtText && (
                <p className="mt-1 text-xs text-gray-500">{joinedAtText}</p>
              )}
            </div>
          </div>

          {/* 후기 목록 */}
          <div className="space-y-4 max-h-[420px] overflow-y-auto">
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
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-yellow-500 text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-900">
                            {overallScore.toFixed(1)}
                          </span>
                        </span>
                      </div>
                      {review.createdAt && (
                        <span className="text-xs text-gray-500">
                          작성일:{" "}
                          {(() => {
                            const date = new Date(review.createdAt);
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

                    <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        장비
                        <span className="flex items-center gap-0.5 text-yellow-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{review.equipmentScore}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        친절도
                        <span className="flex items-center gap-0.5 text-yellow-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{review.kindnessScore}</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        응답시간
                        <span className="flex items-center gap-0.5 text-yellow-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{review.responseTimeScore}</span>
                        </span>
                      </span>
                    </div>

                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="pt-2 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


