/**
 * AI 검색 결과 페이지
 */
"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { Post, ReceiveMethod } from "@/types/domain";

import { parseLocalDateString } from "@/lib/utils";
import { getImageUrl } from "@/lib/utils/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useAISearchQuery } from "@/queries/post";
import { useToggleFavoriteMutation } from "@/queries/post-favorite";
import { useCategoryListQuery } from "@/queries/category";
import { useRegionListQuery } from "@/queries/region";
import { useAuthStore } from "@/store/authStore";

import { Heart, MapPin, Send, Sparkles } from "lucide-react";

const RECEIVE_METHOD_LABELS: Record<ReceiveMethod, string> = {
  DIRECT: "직거래",
  DELIVERY: "택배",
  ANY: "상관없음",
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(queryParam);

  const {
    data: searchResult,
    isLoading,
    error,
  } = useAISearchQuery(queryParam || null);
  const { isAuthenticated, user } = useAuthStore();
  const toggleFavoriteMutation = useToggleFavoriteMutation();
  const { data: regions } = useRegionListQuery();
  const { data: categories } = useCategoryListQuery();

  // 디버깅용 로그
  if (process.env.NODE_ENV === "development") {
    console.log("[SearchPage] queryParam:", queryParam);
    console.log("[SearchPage] searchResult:", searchResult);
    console.log("[SearchPage] isLoading:", isLoading);
    console.log("[SearchPage] error:", error);
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent, post: Post) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      return;
    }
    toggleFavoriteMutation.mutate(post.id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 검색 바 */}
      <div className="mb-8">
        <div className="relative">
            <div
              className="relative flex items-center rounded-lg"
              style={{
                background:
                  "linear-gradient(white, white) padding-box, linear-gradient(135deg, rgba(51, 133, 255, 0.5), rgba(125, 94, 247, 0.5), rgba(250, 115, 227, 0.5), rgba(255, 123, 46, 0.5), rgba(51, 133, 255, 0.5)) border-box",
                border: "1px solid transparent",
              }}
            >
              <div className="flex-1 flex items-center bg-white rounded-lg">
              <div className="pl-4 pr-2">
                <Sparkles className="h-6 w-6 text-blue-500" />
              </div>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="어떤 장비를 찾고 있나요?"
                className="flex-1 border-0 text-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="button"
                onClick={handleSearch}
                className="m-2 h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 p-0"
              >
                <Send className="h-6 w-6 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 결과 */}
      {isLoading ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-12 pt-12">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-blue-500 animate-pulse" />
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      AI가 응답을 생성하고 있습니다...
                    </h3>
                    <p className="text-gray-600">
                      잠시만 기다려주세요. 최대 10초 정도 소요될 수 있습니다.
                    </p>
                  </div>
                </div>
                <div className="w-full max-w-md">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4"></div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="mt-4"
                >
                  검색 취소
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 pt-12 text-center">
            <p className="text-gray-500">
              검색 중 오류가 발생했습니다. 다시 시도해주세요.
            </p>
            {process.env.NODE_ENV === "development" && (
              <p className="mt-2 text-xs text-gray-400">
                {error instanceof Error ? error.message : String(error)}
              </p>
            )}
          </CardContent>
        </Card>
      ) : searchResult ? (
        <div className="space-y-6">
          {/* AI 응답 */}
          <Card>
            <CardContent className="p-6 pt-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0">
                  <Sparkles className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    에이전트 답변
                  </h2>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {searchResult.answer}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 게시글 목록 */}
          {searchResult.posts.length > 0 ? (
            <div className="space-y-4">
              {searchResult.posts.map((post: Post) => (
                <Link key={post.id} href={`/posts/${post.id}`}>
                  <Card className="group transition-all hover:shadow-lg">
                    <CardContent className="p-4 pt-4">
                      <div className="flex items-center gap-4">
                        {/* 이미지 */}
                        <div className="shrink-0">
                          <Image
                            src={getImageUrl(
                              post.thumbnailImageUrl ||
                                post.images?.[0]?.file ||
                                post.images?.[0]?.url ||
                                "",
                            )}
                            alt={post.title}
                            width={120}
                            height={120}
                            className="rounded-lg object-cover w-[120px] h-[120px]"
                          />
                        </div>

                        {/* 정보 */}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600">
                                {post.title}
                              </h3>
                              {/* 카테고리 */}
                              {post.categoryId && categories && (() => {
                                const findCategory = (catId: number, catList: typeof categories): { main: string; sub: string } | null => {
                                  for (const mainCat of catList) {
                                    const subCategories = mainCat.child || mainCat.children || [];
                                    const subCat = subCategories.find((c) => c.id === catId);
                                    if (subCat) {
                                      return { main: mainCat.name, sub: subCat.name };
                                    }
                                  }
                                  return null;
                                };
                                const categoryInfo = findCategory(post.categoryId, categories);
                                return categoryInfo ? (
                                  <div className="text-sm text-gray-600 mb-1">
                                    {categoryInfo.main} &gt; {categoryInfo.sub}
                                  </div>
                                ) : null;
                              })()}
                              {/* 지역 */}
                              {post.regionIds && post.regionIds.length > 0 && regions && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>
                                    {post.regionIds
                                      .map((id) => {
                                        const region = regions.find((r) => r.id === id);
                                        return region?.name;
                                      })
                                      .filter(Boolean)
                                      .join(", ")}
                                  </span>
                                </div>
                              )}
                              {/* 수령/반납 방법 */}
                              <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                                <span>수령: {RECEIVE_METHOD_LABELS[post.receiveMethod]}</span>
                                <span>반납: {RECEIVE_METHOD_LABELS[post.returnMethod]}</span>
                              </div>
                              {/* 작성자 */}
                              {post.authorNickname && (
                                <p className="text-sm text-gray-600 mb-1">
                                  작성자: {post.authorNickname}
                                </p>
                              )}
                              {/* 작성일 */}
                              <p className="text-sm text-gray-600 mb-2">
                                {post.createdAt &&
                                  (() => {
                                    const date = parseLocalDateString(
                                      post.createdAt,
                                    );
                                    return `작성일: ${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                                  })()}
                              </p>
                              {/* 가격 정보 */}
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-semibold text-blue-600">
                                  대여료: {post.fee?.toLocaleString() || 0}원/일
                                </span>
                                <span className="text-gray-600">
                                  보증금: {post.deposit?.toLocaleString() || 0}원
                                </span>
                              </div>
                            </div>
                            {/* 즐겨찾기 버튼 */}
                            <button
                              type="button"
                              onClick={(e) => handleFavoriteClick(e, post)}
                              className="flex-shrink-0 rounded-full bg-white bg-opacity-80 p-2 shadow-md hover:bg-opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={
                                !isAuthenticated ||
                                toggleFavoriteMutation.isPending ||
                                Boolean(post.authorId === user?.id)
                              }
                            >
                              <Heart
                                className={`h-5 w-5 ${
                                  post.isFavorite ?? false
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-400"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
          <Card>
            <CardContent className="p-12 pt-12 text-center">
              <p className="text-gray-500">
                검색 결과에 해당하는 게시글이 없습니다.
              </p>
            </CardContent>
          </Card>
          )}
        </div>
      ) : queryParam ? (
        <Card>
          <CardContent className="p-12 pt-12 text-center">
            <p className="text-gray-500">검색 결과를 불러올 수 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 pt-12 text-center">
            <p className="text-gray-500">
              검색어를 입력하고 검색 버튼을 눌러주세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

