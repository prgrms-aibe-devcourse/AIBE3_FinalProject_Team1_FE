/**
 * 신고 다이얼로그 컴포넌트
 */
"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ReportType } from "@/types/domain";

import { useCreateReportMutation } from "@/queries/report";

import { HelpCircle } from "lucide-react";

// 신고 사유 옵션
const REPORT_REASON_OPTIONS = [
  { value: "SPAM", label: "스팸/홍보" },
  { value: "INAPPROPRIATE", label: "부적절한 내용" },
  { value: "FRAUD", label: "사기/거짓 정보" },
  { value: "HARASSMENT", label: "욕설/혐오 표현" },
  { value: "COPYRIGHT", label: "저작권 침해" },
  { value: "OTHER", label: "기타 (직접 작성)" },
] as const;

type ReportReason = (typeof REPORT_REASON_OPTIONS)[number]["value"];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: ReportType;
  targetId: number;
  targetTitle: string;
}

const MAX_COMMENT_LENGTH = 500;

const REPORT_TYPE_CONFIG: Record<
  ReportType,
  { label: string; bgColor: string; textColor: string; iconColor: string }
> = {
  [ReportType.POST]: {
    label: "게시글",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    iconColor: "text-blue-600",
  },
  [ReportType.MEMBER]: {
    label: "사용자",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    iconColor: "text-red-600",
  },
  [ReportType.REVIEW]: {
    label: "리뷰",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    iconColor: "text-yellow-600",
  },
};

export function ReportDialog({
  open,
  onOpenChange,
  reportType,
  targetId,
  targetTitle,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | "">("");
  const [comment, setComment] = useState("");
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const createReportMutation = useCreateReportMutation();

  const isOtherSelected = selectedReason === "OTHER";

  const handleSubmit = async () => {
    if (!selectedReason) {
      return;
    }

    // 기타 선택 시 comment 필수, 그 외에는 선택한 사유를 comment로 사용
    const reportComment = isOtherSelected
      ? comment.trim()
      : REPORT_REASON_OPTIONS.find((opt) => opt.value === selectedReason)
          ?.label || "";

    if (!reportComment) {
      return;
    }

    try {
      await createReportMutation.mutateAsync({
        reportType,
        targetId,
        comment: reportComment,
      });
      // 성공 시 모달 닫기 및 입력 초기화
      setSelectedReason("");
      setComment("");
      onOpenChange(false);
    } catch (error) {
      // 에러는 mutation의 onError에서 처리됨
      console.error("Failed to submit report:", error);
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setComment("");
    onOpenChange(false);
  };

  const commentLength = comment.length;
  const isCommentValid = isOtherSelected
    ? comment.trim().length > 0
    : selectedReason !== "";

  const typeConfig = REPORT_TYPE_CONFIG[reportType];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>신고</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* 신고 대상 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-900">
                신고 대상
              </label>
              <TooltipProvider delayDuration={0}>
                <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="신고 대상 타입 안내"
                      onMouseEnter={() => setTooltipOpen(true)}
                      onMouseLeave={() => setTooltipOpen(false)}
                      onFocus={(e) => {
                        // 포커스로 인한 자동 열림 방지
                        e.preventDefault();
                        e.currentTarget.blur();
                      }}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    className="p-3"
                    onMouseEnter={() => setTooltipOpen(true)}
                    onMouseLeave={() => setTooltipOpen(false)}
                    side="right"
                  >
                    <div className="space-y-2">
                      {Object.entries(REPORT_TYPE_CONFIG).map(
                        ([type, config]) => {
                          // border 색상 매핑
                          const borderColorMap: Record<string, string> = {
                            "text-blue-700": "border-blue-300",
                            "text-red-700": "border-red-300",
                            "text-yellow-700": "border-yellow-300",
                          };
                          const borderColor =
                            borderColorMap[config.textColor] ||
                            "border-gray-300";

                          return (
                            <div
                              key={type}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div
                                className={`h-4 w-4 rounded ${config.bgColor} border ${borderColor}`}
                              />
                              <span className="text-gray-900">
                                {config.label}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div
              className={`inline-flex items-center rounded-full ${typeConfig.bgColor} px-3 py-1 text-sm ${typeConfig.textColor}`}
            >
              {targetTitle}
            </div>
          </div>

          {/* 신고 사유 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              신고 사유 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value as ReportReason | "");
                if (e.target.value !== "OTHER") {
                  setComment("");
                }
              }}
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">신고 사유를 선택해주세요</option>
              {REPORT_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isOtherSelected && (
              <div className="space-y-2">
                <Textarea
                  placeholder="신고 사유를 자세히 입력해주세요."
                  value={comment}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue.length <= MAX_COMMENT_LENGTH) {
                      setComment(newValue);
                    }
                  }}
                  className="min-h-[120px]"
                  error={!isCommentValid && commentLength > 0}
                />
                <div className="flex justify-end">
                  <span
                    className={`text-xs ${
                      commentLength > MAX_COMMENT_LENGTH
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    {commentLength}/{MAX_COMMENT_LENGTH}자
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 신고 안내 */}
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 shrink-0 mt-0.5">
                <span className="text-xs font-semibold">i</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  신고 안내
                </p>
                <ul className="space-y-1 text-xs text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>허위 신고 시 제재를 받을 수 있습니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>신고 내용은 관리자가 검토 후 조치합니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>처리 결과는 별도로 안내해드리지 않습니다</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createReportMutation.isPending}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isCommentValid || createReportMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {createReportMutation.isPending ? "신고 중..." : "신고하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

