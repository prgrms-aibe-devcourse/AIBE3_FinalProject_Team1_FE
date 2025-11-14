/**
 * 게시글 상세 페이지
 */
"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuthStore } from "@/store/authStore";

import { useDeletePostMutation, usePostQuery } from "@/queries/post";
import {
  useAddFavoriteMutation,
  useFavoriteCheckQuery,
  useRemoveFavoriteMutation,
} from "@/queries/post-favorite";
import { useCreateChatRoomMutation } from "@/queries/chat";

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

/**
 * 게시글 상세 페이지
 */

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);
  const { data: post, isLoading } = usePostQuery(postId);
  const { isAuthenticated, user } = useAuthStore();
  const { data: isFavorite } = useFavoriteCheckQuery(postId);
  const addFavoriteMutation = useAddFavoriteMutation();
  const removeFavoriteMutation = useRemoveFavoriteMutation();
  const deletePostMutation = useDeletePostMutation();
  const createChatRoomMutation = useCreateChatRoomMutation();

  const handleFavorite = () => {
    if (isFavorite) {
      removeFavoriteMutation.mutate(postId);
    } else {
      addFavoriteMutation.mutate(postId);
    }
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
      // 에러가 발생해도 채팅 페이지로 이동 시도
      router.push("/chat");
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← 뒤로가기
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 이미지 섹션 */}
        <div>
          {post.images && post.images.length > 0 ? (
            <div className="relative h-96 w-full overflow-hidden rounded-lg">
              <Image
                src={post.images[0].url}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100">
              <p className="text-gray-400">이미지 없음</p>
            </div>
          )}
        </div>

        {/* 정보 섹션 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-2xl">{post.title}</CardTitle>
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFavorite}
                    disabled={
                      addFavoriteMutation.isPending ||
                      removeFavoriteMutation.isPending
                    }
                  >
                    {isFavorite ? "❤️" : "🤍"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">장비 정보</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">보증금</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {post.deposit.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">1일 대여금</p>
                  <p className="text-lg font-semibold">
                    {post.fee.toLocaleString()}원
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">수령 방법</p>
                <p className="text-base">{post.receiveMethod}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">반납 방법</p>
                <p className="text-base">{post.returnMethod}</p>
              </div>

              {isAuthor ? (
                <div className="flex gap-2 pt-4">
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
              ) : (
                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    className="w-full"
                    onClick={() =>
                      router.push(`/reservations/new?postId=${postId}`)
                    }
                  >
                    예약하기
                  </Button>
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleChat}
                      disabled={createChatRoomMutation.isPending}
                    >
                      {createChatRoomMutation.isPending
                        ? "채팅방 생성 중..."
                        : "채팅하기"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
