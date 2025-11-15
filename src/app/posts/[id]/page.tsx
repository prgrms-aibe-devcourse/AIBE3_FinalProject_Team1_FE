/**
 * 게시글 상세 페이지
 */
"use client";

import { useState } from "react";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuthStore } from "@/store/authStore";

import { useCreateChatRoomMutation } from "@/queries/chat";
import { useDeletePostMutation, usePostQuery } from "@/queries/post";
import { useToggleFavoriteMutation } from "@/queries/post-favorite";
import { useReviewsByPostQuery } from "@/queries/review";

import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  MapPin,
  RotateCcw,
  Truck,
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

/**
 * 게시글 상세 페이지
 */
export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);
  const { data: post, isLoading } = usePostQuery(postId);
  const { data: reviewsData } = useReviewsByPostQuery(postId);
  const { isAuthenticated, user } = useAuthStore();
  const toggleFavoriteMutation = useToggleFavoriteMutation();
  const deletePostMutation = useDeletePostMutation();
  const createChatRoomMutation = useCreateChatRoomMutation();

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
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.equipmentScore, 0) /
        reviews.length
      : 0;

  const handleFavorite = () => {
    toggleFavoriteMutation.mutate(postId);
  };

  const handleDelete = async () => {
    if (confirm("정말 삭제하시겠습니까?")) {
      await deletePostMutation.mutateAsync(postId);
      router.push("/posts");
    }
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      // 채팅방 생성 (API가 이미 존재하는 채팅방이 있으면 chatRoomId 반환, 없으면 생성)
      const result = await createChatRoomMutation.mutateAsync(postId);
      // response가 { id: number } 또는 ChatRoom 객체이므로 항상 id 속성 있음
      router.push(`/chat?roomId=${result.id}`);
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

  const isAuthor = user?.id === post.authorId;

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
                          className={`relative flex-shrink-0 w-20 h-20 overflow-hidden rounded-lg cursor-pointer transition-all ${
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
              <div className="flex items-center gap-4">
                <span className="text-2xl font-semibold text-blue-600">
                  {post.fee.toLocaleString()}원/일
                </span>
              </div>
            </div>
          </div>

          {/* 우측: 작성자 정보 및 액션 카드 (1/3) */}
          {!isAuthor && (
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {/* 작성자 프로필 섹션 */}
                  <div className="flex items-start gap-4 pb-4 bg-gray-50 rounded-lg p-4 mb-4">
                    {post.author?.profileImgUrl ? (
                      <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={post.author.profileImgUrl}
                          alt={post.author.nickname || "작성자"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
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
                      <p className="font-semibold text-lg">
                        {post.author?.nickname || post.authorNickname || "익명"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span>★4.9</span>
                        <span>응답률 98%</span>
                      </div>
                      {post.author?.createdAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {(() => {
                            const date = new Date(post.author.createdAt);
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
                        <MapPin className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
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
                  <div className="flex gap-2 mb-4 bg-gray-50 rounded-lg p-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleFavorite}
                      disabled={
                        toggleFavoriteMutation.isPending || !isAuthenticated
                      }
                    >
                      <Heart
                        className={`h-4 w-4 mr-2 ${
                          isFavorite ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                      {post.favoriteCount || 0}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* 메시지 보내기 및 대여 신청 버튼 */}
                  {isAuthenticated && (
                    <div className="space-y-2">
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
                      <Button
                        className="w-full"
                        onClick={() =>
                          router.push(`/reservations/new?postId=${postId}`)
                        }
                      >
                        대여 신청
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
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
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
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
                  {post.options.map((option, index) => (
                    <div
                      key={option.id || index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">
                            {option.name}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {option.deposit > 0 && (
                              <span>
                                보증금: {option.deposit.toLocaleString()}원
                              </span>
                            )}
                            {option.fee > 0 && (
                              <span className="text-blue-600 font-semibold">
                                추가 요금: {option.fee.toLocaleString()}원/일
                              </span>
                            )}
                            {option.deposit === 0 && option.fee === 0 && (
                              <span className="text-gray-500">
                                추가 요금 없음
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 작성자 수정/삭제 버튼 */}
          {isAuthor && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/posts/${postId}/edit`)}
              >
                수정
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deletePostMutation.isPending}
              >
                삭제
              </Button>
            </div>
          )}

          {/* 후기 섹션 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  후기{" "}
                  {reviews.length > 0 && (
                    <span className="text-base font-normal text-gray-500">
                      ★{averageRating.toFixed(1)} ({reviews.length}개 후기)
                    </span>
                  )}
                </CardTitle>
                {reviews.length > 5 && (
                  <Button variant="ghost" size="sm">
                    전체보기
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.slice(0, 5).map((review) => (
                    <div
                      key={review.id}
                      className="border-b pb-6 last:border-0"
                    >
                      <div className="flex items-start gap-4 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600">
                            {review.member?.nickname?.[0] || "U"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {review.member?.nickname || "익명"}
                            </span>
                            <span className="text-xs text-gray-500">
                              완료된 대여
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {review.reservation?.reservationStartAt &&
                              review.reservation?.reservationEndAt && (
                                <>
                                  대여 기간:{" "}
                                  {(() => {
                                    const start = new Date(
                                      review.reservation.reservationStartAt,
                                    );
                                    const end = new Date(
                                      review.reservation.reservationEndAt,
                                    );
                                    const startStr = `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, "0")}.${String(start.getDate()).padStart(2, "0")}`;
                                    const endStr = `${end.getFullYear()}.${String(end.getMonth() + 1).padStart(2, "0")}.${String(end.getDate()).padStart(2, "0")}`;
                                    return `${startStr} - ${endStr}`;
                                  })()}
                                </>
                              )}
                            {review.createdAt && (
                              <span className="ml-2">
                                후기 작성일:{" "}
                                {(() => {
                                  const date = new Date(review.createdAt);
                                  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
                                })()}
                              </span>
                            )}
                          </div>
                          <div className="mb-2">
                            <span className="text-yellow-500">
                              {"★".repeat(review.equipmentScore)}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  아직 후기가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
