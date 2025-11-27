/**
 * 게시글 상세 페이지
 */
"use client";

import { useState } from "react";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { ReportType } from "@/types/domain";

import { parseLocalDateString } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ProfileReviewDialog } from "@/components/profile/profile-review-dialog";
import { ReportDialog } from "@/components/report/report-dialog";

import { useAuthStore } from "@/store/authStore";

import { useCreateChatRoomMutation } from "@/queries/chat";
import { usePostQuery } from "@/queries/post";
import { useToggleFavoriteMutation } from "@/queries/post-favorite";
import { useReviewsByPostQuery } from "@/queries/review";

import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  MapPin,
  RotateCcw,
  Star,
  Truck,
  User,
} from "lucide-react";

/**
 * 게시글 상세 페이지
 */

/**
 * 게시글 상세 페이지
 */

/**
 * 게시글 상세 페이지
 */

/**
 * 게시글 상세 페이지
 */
export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);
  const { data: post, isLoading } = usePostQuery(postId);
  const [reviewPage, setReviewPage] = useState(0);
  const reviewPageSize = 5;
  const { data: reviewsData } = useReviewsByPostQuery(postId, {
    page: reviewPage,
    size: reviewPageSize,
  });
  const { isAuthenticated, user } = useAuthStore();
  const toggleFavoriteMutation = useToggleFavoriteMutation();
  const createChatRoomMutation = useCreateChatRoomMutation();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reviewReportDialogOpen, setReviewReportDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<{
    id: number;
    comment: string;
  } | null>(null);

  // post.isFavorite를 사용 (optimistic update가 이미 적용됨)
  const isFavorite = post?.isFavorite ?? false;

  // 이미지 URL 목록 가져오기 (원본 이미지 정보 포함)
  const imagesWithUrls = post?.images
    ? post.images
        .map((img) => ({
          url: img.file || img.url || "",
          isPrimary: img.isPrimary,
        }))
        .filter((img) => img.url)
    : [];

  // isPrimary가 true인 이미지 찾기
  const primaryImageIndex = imagesWithUrls.findIndex((img) => img.isPrimary);

  // 썸네일 URL이 있으면 images 목록에 포함시킴
  // 썸네일이 isPrimary인 이미지와 같다면 중복 제거
  const allImageUrls = post?.thumbnailImageUrl
    ? [
        post.thumbnailImageUrl,
        ...imagesWithUrls
          .map((img) => img.url)
          .filter((url) => url !== post.thumbnailImageUrl),
      ]
    : imagesWithUrls.map((img) => img.url);

  // 기본 선택 인덱스 결정 로직:
  // 1. thumbnailImageUrl이 있으면 0번 (썸네일 우선)
  // 2. 없으면 isPrimary가 true인 이미지의 인덱스
  // 3. 그것도 없으면 0번
  const defaultSelectedIndex = post?.thumbnailImageUrl
    ? 0
    : primaryImageIndex >= 0
      ? primaryImageIndex
      : 0;

  // 선택된 이미지 인덱스 상태 (isPrimary가 true인 이미지로 초기화, 또는 썸네일이 있으면 0)
  const [selectedImageIndex, setSelectedImageIndex] =
    useState(defaultSelectedIndex);

  // 썸네일 스크롤 인덱스 (5개씩 보이도록)
  const [thumbnailScrollIndex, setThumbnailScrollIndex] = useState(0);
  const visibleThumbnailCount = 5;

  // 메인 이미지 URL (선택된 인덱스의 이미지)
  const mainImageUrl =
    allImageUrls.length > 0 ? allImageUrls[selectedImageIndex] : null;

  // 썸네일 스크롤 핸들러
  const handleThumbnailScroll = (direction: "left" | "right") => {
    if (direction === "left") {
      setThumbnailScrollIndex(Math.max(0, thumbnailScrollIndex - 1));
    } else {
      const maxScroll = Math.max(
        0,
        allImageUrls.length - visibleThumbnailCount,
      );
      setThumbnailScrollIndex(Math.min(maxScroll, thumbnailScrollIndex + 1));
    }
  };

  // 표시할 썸네일 범위 계산
  const visibleThumbnails = allImageUrls.slice(
    thumbnailScrollIndex,
    thumbnailScrollIndex + visibleThumbnailCount,
  );
  const thumbnailStartIndex = thumbnailScrollIndex;

  const reviews = reviewsData?.content || [];
  const totalReviewPages = reviewsData?.page?.totalPages || 1;
  const totalReviewCount = reviewsData?.page?.totalElements || reviews.length;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
          (sum, review) =>
            sum +
            (review.equipmentScore +
              review.kindnessScore +
              review.responseTimeScore) /
              3,
          0,
        ) / reviews.length
      : 0;

  const handleFavorite = () => {
    toggleFavoriteMutation.mutate(postId);
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      // 채팅방 생성 (API가 이미 존재하는 채팅방이 있으면 chatRoomId 반환, 없으면 생성)
      const result = await createChatRoomMutation.mutateAsync(postId);
      // API 응답: { message: string; chatRoomId: number }
      if (result.chatRoomId) {
        router.push(`/chat?roomId=${result.chatRoomId}`);
      } else {
        console.error("Failed to get chatRoomId from response:", result);
      }
    } catch (error) {
      console.error("Failed to create chat room:", error);
      // API 실패 시 페이지 이동하지 않음
      // 에러 메시지는 mutation의 onError에서 처리됨 (toast 표시)
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-64 bg-gray-200 rounded mb-4" />
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">게시글을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isAuthor = user?.id === (post.author?.id ?? post.authorId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← 뒤로가기
        </Button>
      </div>

      <div className="space-y-6">
        {/* 이미지, 제목, 우측 카드 묶음 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 이미지 및 제목 (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 메인 이미지 */}
            <div>
              {mainImageUrl ? (
                <div className="relative h-[500px] w-full overflow-hidden rounded-lg mb-4">
                  <Image
                    src={mainImageUrl}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="flex h-[500px] items-center justify-center rounded-lg bg-gray-100 mb-4">
                  <p className="text-gray-400">이미지 없음</p>
                </div>
              )}

              {/* 썸네일 이미지 목록 (스크롤 가능) */}
              {allImageUrls.length > 1 && (
                <div className="relative">
                  {/* 왼쪽 스크롤 버튼 */}
                  {thumbnailScrollIndex > 0 && (
                    <button
                      onClick={() => handleThumbnailScroll("left")}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-1 shadow-md transition-all"
                      aria-label="이전 이미지"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-700" />
                    </button>
                  )}

                  {/* 썸네일 컨테이너 */}
                  <div className="flex gap-2 overflow-hidden px-8">
                    {visibleThumbnails.map((imageUrl, visibleIndex) => {
                      const actualIndex = thumbnailStartIndex + visibleIndex;
                      return (
                        <div
                          key={actualIndex}
                          onClick={() => setSelectedImageIndex(actualIndex)}
                          className={`relative shrink-0 w-20 h-20 overflow-hidden rounded-lg cursor-pointer transition-all ${
                            selectedImageIndex === actualIndex
                              ? "ring-2 ring-blue-500 ring-offset-2"
                              : "hover:opacity-80"
                          }`}
                        >
                          <Image
                            src={imageUrl}
                            alt={`${post.title} ${actualIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* 오른쪽 스크롤 버튼 */}
                  {thumbnailScrollIndex <
                    allImageUrls.length - visibleThumbnailCount && (
                    <button
                      onClick={() => handleThumbnailScroll("right")}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-1 shadow-md transition-all"
                      aria-label="다음 이미지"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-700" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 제목 및 요금 정보 */}
            <div>
              <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-semibold text-blue-600">
                  {post.fee.toLocaleString()}원/일
                </span>
                {post.deposit > 0 && (
                  <span className="text-lg text-gray-600 text-right">
                    보증금: {post.deposit.toLocaleString()}원
                  </span>
                )}
              </div>
              {post.createdAt && (
                <p className="text-sm text-gray-500">
                  작성일:{" "}
                  {(() => {
                    const date = parseLocalDateString(post.createdAt);
                    return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}.`;
                  })()}
                </p>
              )}
            </div>
          </div>

          {/* 우측: 작성자 정보 및 액션 카드 (1/3) */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4 pt-4 space-y-4">
                {/* 작성자 프로필 섹션 */}
                <div className="flex items-start gap-4 pb-4 bg-gray-50 rounded-lg p-4 mb-4">
                  {post.author?.profileImgUrl ? (
                    <div className="relative h-16 w-16 rounded-full overflow-hidden shrink-0">
                      <Image
                        src={post.author.profileImgUrl}
                        alt={post.author.nickname || "작성자"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                      <span className="text-gray-600 text-xl font-semibold">
                        {
                          (post.author?.nickname ||
                            post.authorNickname ||
                            "U")[0]
                        }
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setProfileDialogOpen(true)}
                      className="font-semibold text-lg text-left text-gray-900 hover:text-blue-600"
                    >
                      {post.author?.nickname || post.authorNickname || "익명"}
                    </button>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <span>★4.9</span>
                      <span>응답률 98%</span>
                    </div>
                    {post.author?.createdAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const date = parseLocalDateString(
                            post.author.createdAt,
                          );
                          return `${date.getFullYear()}년 ${date.getMonth() + 1}월 가입`;
                        })()}
                      </p>
                    )}
                  </div>
                </div>

                {/* 반납 주소 섹션 */}
                {(post.returnAddress1 || post.returnAddress2) && (
                  <div className="pb-4 mb-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">반납 주소</p>
                    </div>
                    <div className="bg-white rounded p-2 text-sm space-y-1">
                      {post.returnAddress1 && (
                        <p className="text-gray-700">{post.returnAddress1}</p>
                      )}
                      {post.returnAddress2 && (
                        <p className="text-gray-700">{post.returnAddress2}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 수령/반납 방식 섹션 */}
                <div className="space-y-4 pb-4 mb-4 bg-gray-50 rounded-lg p-4">
                  {/* 수령 방식 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="h-4 w-4 text-blue-500" />
                      <p className="text-sm font-medium">수령 방식</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.receiveMethod === "ANY" ||
                      post.receiveMethod === "DIRECT" ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          직접 수령
                        </span>
                      ) : null}
                      {post.receiveMethod === "ANY" ||
                      post.receiveMethod === "DELIVERY" ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          택배 발송
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* 반납 방식 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <RotateCcw className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-medium">반납 방식</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.returnMethod === "ANY" ||
                      post.returnMethod === "DIRECT" ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          직접 반납
                        </span>
                      ) : null}
                      {post.returnMethod === "ANY" ||
                      post.returnMethod === "DELIVERY" ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          택배 반납
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* 좋아요 및 신고 버튼 */}
                {isAuthenticated && (
                  <div className="flex gap-2 mb-4 bg-gray-50 rounded-lg p-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1 whitespace-nowrap"
                            onClick={handleFavorite}
                            disabled={
                              toggleFavoriteMutation.isPending || isAuthor
                            }
                          >
                            <Heart
                              className={`h-4 w-4 mr-2 ${
                                isFavorite ? "fill-red-500 text-red-500" : ""
                              }`}
                            />
                            즐겨찾기
                          </Button>
                        </TooltipTrigger>
                        {isAuthor && (
                          <TooltipContent sideOffset={12}>
                            <p>자신의 게시글에는 즐겨찾기를 할 수 없습니다.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      variant="outline"
                      className="flex-1 whitespace-nowrap"
                      onClick={() => setReportDialogOpen(true)}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      신고하기
                    </Button>
                  </div>
                )}

                {/* 메시지 보내기 및 대여 신청 버튼 */}
                <div className="space-y-2">
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleChat}
                      disabled={createChatRoomMutation.isPending}
                    >
                      {createChatRoomMutation.isPending
                        ? "채팅방 생성 중..."
                        : "메시지 보내기"}
                    </Button>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="w-full">
                          <Button
                            className="w-full"
                            onClick={() => {
                              if (!isAuthenticated) {
                                router.push(`/login?redirect=/posts/${postId}`);
                                return;
                              }
                              if (isAuthor) {
                                return;
                              }
                              router.push(`/reservations/new?postId=${postId}`);
                            }}
                            disabled={isAuthor}
                          >
                            대여 신청
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {isAuthor && (
                        <TooltipContent sideOffset={12}>
                          <p>자신의 게시글에는 예약신청 할 수 없습니다.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 상세 설명 및 후기 섹션 (같은 너비) */}
      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 상세 설명 */}
          <Card>
            <CardHeader>
              <CardTitle>상세 설명</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed wrap-break-word">
                  {post.content}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 옵션 섹션 */}
          {post.options && post.options.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>추가 옵션</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {post.options.map((option) => (
                    <div
                      key={option.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">
                            {option.name}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span className="text-blue-600 font-semibold">
                              추가 요금:{" "}
                              {option.fee > 0
                                ? `${option.fee.toLocaleString()}원/일`
                                : "무료/일"}
                            </span>
                            <span className="text-right">
                              보증금:{" "}
                              {option.deposit > 0
                                ? `${option.deposit.toLocaleString()}원`
                                : "무료"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 후기 섹션 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  후기{" "}
                  {reviews.length > 0 && (
                    <span className="text-base font-normal text-gray-500">
                      ★{averageRating.toFixed(1)} ({totalReviewCount}개 후기)
                    </span>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => {
                    const overallScore =
                      (review.equipmentScore +
                        review.kindnessScore +
                        review.responseTimeScore) /
                      3;
                    return (
                      <div
                        key={review.id}
                        className="border-b pb-6 last:border-0 relative"
                      >
                        {/* 신고하기 버튼 - 우측 상단 */}
                        {isAuthenticated && (
                          <div className="absolute top-0 right-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
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
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  >
                                    <Flag className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>신고하기</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}

                        <div className="flex items-start gap-4 mb-3 pr-16">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">
                                {review.author?.nickname || "익명"}
                              </span>
                              {review.createdAt && (
                                <span className="text-xs text-gray-500">
                                  작성일:{" "}
                                  {(() => {
                                    const date = parseLocalDateString(
                                      review.createdAt,
                                    );
                                    const yyyy = date.getFullYear();
                                    const mm = String(
                                      date.getMonth() + 1,
                                    ).padStart(2, "0");
                                    const dd = String(date.getDate()).padStart(
                                      2,
                                      "0",
                                    );
                                    return `${yyyy}-${mm}-${dd}`;
                                  })()}
                                </span>
                              )}
                            </div>

                            {/* 전체 평균 + 항목별 점수 */}
                            <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
                              <span className="flex items-center gap-1 text-yellow-500">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-gray-900">
                                  {overallScore.toFixed(1)}
                                </span>
                              </span>
                              <span className="flex items-center gap-2 text-gray-600">
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
                              </span>
                            </div>

                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  아직 후기가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>

          {totalReviewPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={reviewPage + 1}
                totalPages={totalReviewPages}
                onPageChange={(newPage) => setReviewPage(newPage - 1)}
              />
            </div>
          )}
        </div>
      </div>

      {/* 작성자 프로필 & 받은 후기 다이얼로그 */}
      <ProfileReviewDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        author={post?.author ?? null}
        memberId={post?.author?.id}
      />

      {/* 게시글 신고 다이얼로그 */}
      {post && (
        <ReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          reportType={ReportType.POST}
          targetId={post.id}
          targetTitle={post.title}
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
    </div>
  );
}
