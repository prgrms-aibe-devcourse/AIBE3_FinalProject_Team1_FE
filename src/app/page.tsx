/**
 * 홈 페이지
 */
"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Category, Post, ReceiveMethod, Region } from "@/types/domain";

import { parseLocalDateString } from "@/lib/utils";
import { getImageUrl } from "@/lib/utils/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAuthStore } from "@/store/authStore";

import { useCategoryListQuery } from "@/queries/category";
import { usePostListQuery } from "@/queries/post";
import { useToggleFavoriteMutation } from "@/queries/post-favorite";
import { useRegionListQuery } from "@/queries/region";

import {
  Camera,
  Heart,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const RECEIVE_METHOD_LABELS: Record<ReceiveMethod, string> = {
  DIRECT: "직거래",
  DELIVERY: "택배",
  ANY: "상관없음",
};

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated } = useAuthStore();
  const toggleFavoriteMutation = useToggleFavoriteMutation();
  const { data: categories } = useCategoryListQuery();
  const { data: regions } = useRegionListQuery();
  const { data: postsData, isLoading } = usePostListQuery({
    page: 0,
    size: 6,
    sort: ["id,desc"],
  });
  const posts = Array.isArray(postsData) ? postsData : postsData?.content || [];
  const featuredPosts = posts.slice(0, 6);

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

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 py-24 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-5xl font-bold md:text-6xl lg:text-7xl">
                P2P 취미 장비 대여 플랫폼
              </h1>
              <p className="mb-10 text-xl text-blue-50 md:text-2xl">
                필요한 장비를 쉽고 빠르게 대여하세요
              </p>
              {/* AI 검색 바 */}
              <div className="mb-8">
                <div
                  className="relative flex items-center rounded-lg max-w-2xl mx-auto"
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
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/posts">
                  <button className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-lg font-medium text-blue-600 shadow-lg transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    <Search className="mr-2 h-5 w-5" />
                    게시글 보기
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-6 py-3 text-lg font-medium text-white shadow-lg transition-colors hover:bg-white hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2">
                    시작하기
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 md:text-4xl">
              주요 기능
            </h2>
            <p className="mb-12 text-center text-gray-600">
              안전하고 편리한 장비 대여 서비스를 제공합니다
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-2 border-transparent transition-all hover:border-blue-200 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">다양한 장비</CardTitle>
                  <CardDescription className="text-base">
                    카메라, 렌즈, 조명 등 다양한 장비를 대여할 수 있습니다
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-2 border-transparent transition-all hover:border-blue-200 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">안전한 거래</CardTitle>
                  <CardDescription className="text-base">
                    보증금 시스템으로 안전하게 거래할 수 있습니다
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-2 border-transparent transition-all hover:border-blue-200 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">실시간 채팅</CardTitle>
                  <CardDescription className="text-base">
                    대여자와 실시간으로 소통할 수 있습니다
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Posts Section */}
        {!isLoading && featuredPosts.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
                    최근 게시글
                  </h2>
                  <p className="mt-2 text-gray-600">
                    최근에 등록된 장비를 확인하세요
                  </p>
                </div>
                <Link href="/posts">
                  <Button variant="outline" className="hidden sm:flex">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    더보기
                  </Button>
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredPosts.map((post: Post) => {
                  // 카테고리 찾기
                  const findCategoryById = (id: number): Category | null => {
                    if (!categories) return null;
                    for (const category of categories) {
                      if (category.id === id) return category;
                      if (category.child) {
                        const child = category.child.find((c) => c.id === id);
                        if (child) return child;
                      }
                      if (category.children) {
                        const child = category.children.find((c) => c.id === id);
                        if (child) return child;
                      }
                    }
                    return null;
                  };

                  // 지역 이름 찾기
                  const findRegionById = (id: number): Region | null => {
                    if (!regions) return null;
                    for (const region of regions) {
                      if (region.id === id) return region;
                      if (region.child) {
                        const child = region.child.find((r) => r.id === id);
                        if (child) return child;
                      }
                      if (region.children) {
                        const child = region.children.find((r) => r.id === id);
                        if (child) return child;
                      }
                    }
                    return null;
                  };

                  // 카테고리 정보 (대분류와 소분류)
                  const category = post.categoryId
                    ? findCategoryById(post.categoryId)
                    : null;
                  const mainCategory = category
                    ? categories?.find((c) =>
                        (c.child || c.children)?.some(
                          (child) => child.id === category.id,
                        ),
                      )
                    : null;
                  const subCategory = category;

                  const regionNames =
                    post.regionIds && post.regionIds.length > 0
                      ? post.regionIds
                          .map((id: number) => findRegionById(id))
                          .filter((r: Region | null) => r !== null)
                          .map((r: Region | null) => r!.name)
                      : [];

                  const MAX_VISIBLE_REGIONS = 2;

                  const handleFavoriteClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavoriteMutation.mutate(post.id);
                  };

                  const isAuthor = user?.id === (post.author?.id ?? post.authorId);

                  return (
                    <div key={post.id} className="relative">
                      <Link href={`/posts/${post.id}`} className="block">
                        <Card className="h-full transition-shadow hover:shadow-lg relative">
                          {/* 즐겨찾기 버튼 */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={handleFavoriteClick}
                                  className="absolute right-2 top-2 z-10 rounded-full bg-white bg-opacity-80 p-2 shadow-md hover:bg-opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={
                                    !isAuthenticated ||
                                    toggleFavoriteMutation.isPending ||
                                    Boolean(isAuthor)
                                  }
                                >
                                  <Heart
                                    className={`h-5 w-5 ${
                                      (post.isFavorite ?? false)
                                        ? "fill-red-500 text-red-500"
                                        : "text-gray-400"
                                    }`}
                                  />
                                </button>
                              </TooltipTrigger>
                              {!isAuthenticated && (
                                <TooltipContent>
                                  <p>로그인이 필요합니다.</p>
                                </TooltipContent>
                              )}
                              {isAuthenticated && isAuthor && (
                                <TooltipContent>
                                  <p>자신의 게시글에는 즐겨찾기를 할 수 없습니다.</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>

                          {/* 썸네일 이미지 */}
                          {(post.thumbnailImageUrl ||
                            (post.images && post.images.length > 0)) && (
                            <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                              <Image
                                src={getImageUrl(
                                  post.thumbnailImageUrl ||
                                    post.images![0].file ||
                                    post.images![0].url ||
                                    "",
                                )}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                              {/* 카테고리 배지 (좌측 상단) */}
                              <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
                                {mainCategory && (
                                  <span className="inline-block w-fit rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white">
                                    {mainCategory.name}
                                  </span>
                                )}
                                {subCategory &&
                                  subCategory.id !== mainCategory?.id && (
                                    <span className="inline-block w-fit rounded-md bg-blue-400 px-2 py-1 text-xs font-medium text-white">
                                      {subCategory.name}
                                    </span>
                                  )}
                              </div>
                            </div>
                          )}

                          <CardContent className="p-4">
                            <h3 className="mb-2 text-lg font-semibold line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                              {post.content}
                            </p>

                            {/* 수령/반납 방법 */}
                            <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                              <span>
                                수령:{" "}
                                {RECEIVE_METHOD_LABELS[post.receiveMethod] ||
                                  post.receiveMethod}
                              </span>
                              <span>•</span>
                              <span>
                                반납:{" "}
                                {RECEIVE_METHOD_LABELS[post.returnMethod] ||
                                  post.returnMethod}
                              </span>
                            </div>

                            {/* 가격 정보 */}
                            <div className="mb-3 flex items-center justify-between text-sm">
                              <span className="font-semibold text-blue-600">
                                {post.fee.toLocaleString()}원/일
                              </span>
                              <span className="text-gray-500">
                                보증금: {post.deposit.toLocaleString()}원
                              </span>
                            </div>

                            {/* 지역 표시 */}
                            {regionNames.length > 0 && (
                              <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span className="line-clamp-1">
                                  {regionNames
                                    .slice(0, MAX_VISIBLE_REGIONS)
                                    .join(", ")}
                                  {regionNames.length > MAX_VISIBLE_REGIONS &&
                                    ` +${regionNames.length - MAX_VISIBLE_REGIONS}`}
                                </span>
                              </div>
                            )}

                            {/* 작성자 이름 및 작성일 (하단) */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              {post.authorNickname && (
                                <span>{post.authorNickname}</span>
                              )}
                              {post.createdAt && (
                                <span>
                                  {(() => {
                                    const date = parseLocalDateString(
                                      post.createdAt,
                                    );
                                    const year = date.getFullYear();
                                    const month = String(
                                      date.getMonth() + 1,
                                    ).padStart(2, "0");
                                    const day = String(date.getDate()).padStart(
                                      2,
                                      "0",
                                    );
                                    return `${year}-${month}-${day}`;
                                  })()}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 text-center sm:hidden">
                <Link href="/posts">
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    더보기
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
