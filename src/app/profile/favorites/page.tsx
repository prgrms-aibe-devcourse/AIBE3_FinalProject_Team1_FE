/**
 * 마이페이지 - 즐겨찾기 게시글
 */
"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import type { Post, Category, Region } from "@/types/domain";
import { ReceiveMethod } from "@/types/domain";

import { getImageUrl } from "@/lib/utils/image";
import { parseLocalDateString } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";

import { useCategoryListQuery } from "@/queries/category";
import {
  useFavoritePostsQuery,
  useToggleFavoriteMutation,
} from "@/queries/post-favorite";
import { useRegionListQuery } from "@/queries/region";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Heart, MapPin } from "lucide-react";

const RECEIVE_METHOD_LABELS: Record<ReceiveMethod, string> = {
  DIRECT: "직거래",
  DELIVERY: "택배",
  ANY: "상관없음",
};

/**
 * 마이페이지 - 즐겨찾기 게시글
 */
export default function FavoritePostsPage() {
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const { data: favoritePostsData, isLoading: postsLoading } =
    useFavoritePostsQuery({
      page: page,
      size: pageSize,
    });

  const { data: categories } = useCategoryListQuery();
  const { data: regions } = useRegionListQuery();
  const toggleFavoriteMutation = useToggleFavoriteMutation();

  const posts = useMemo(() => {
    if (!favoritePostsData) return [];
    return Array.isArray(favoritePostsData)
      ? favoritePostsData
      : favoritePostsData.content || [];
  }, [favoritePostsData]);

  const totalPages = useMemo(() => {
    if (!favoritePostsData || Array.isArray(favoritePostsData)) return 1;
    return favoritePostsData.page?.totalPages || 1;
  }, [favoritePostsData]);

  const totalElements = useMemo(() => {
    if (!favoritePostsData || Array.isArray(favoritePostsData)) {
      return Array.isArray(favoritePostsData) ? favoritePostsData.length : 0;
    }
    return favoritePostsData.page?.totalElements || 0;
  }, [favoritePostsData]);

  // 카테고리 찾기 함수
  const findCategoryById = (id: number): Category | null => {
    if (!categories) return null;
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.child) {
        const child = category.child.find((c) => c.id === id);
        if (child) return child;
      }
    }
    return null;
  };

  // 지역 찾기 함수
  const findRegionById = (id: number): Region | null => {
    if (!regions) return null;
    for (const region of regions) {
      if (region.id === id) return region;
      if (region.child) {
        const child = region.child.find((r) => r.id === id);
        if (child) return child;
      }
    }
    return null;
  };

  const handleFavoriteClick = (e: React.MouseEvent, postId: number) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteMutation.mutate(postId);
  };

  if (postsLoading) {
    return (
      <div className="p-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">즐겨찾기</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">즐겨찾기</h1>
        <p className="text-sm text-gray-600 mt-2">
          총 {totalElements}개의 즐겨찾기 게시글
        </p>
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">즐겨찾기한 게시글이 없습니다.</p>
            <Link href="/posts">
              <Button>게시글 둘러보기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post: Post) => {
              // 카테고리 정보
              const category = post.categoryId
                ? findCategoryById(post.categoryId)
                : null;
              const mainCategory = category
                ? categories?.find((c) =>
                    c.child?.some((child) => child.id === category.id),
                  )
                : null;
              const subCategory = category;

              // 지역 정보
              const regionNames =
                post.regionIds && post.regionIds.length > 0
                  ? post.regionIds
                      .map((id: number) => findRegionById(id))
                      .filter((r: Region | null) => r !== null)
                      .map((r: Region | null) => r!.name)
                  : [];

              const MAX_VISIBLE_REGIONS = 2;

              return (
                <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <Link href={`/posts/${post.id}`}>
                    {/* 이미지 */}
                    <div className="relative h-48 bg-gray-200">
                      <Image
                        src={getImageUrl(
                          post.thumbnailImageUrl ||
                            post.images?.[0]?.file ||
                            post.images?.[0]?.url ||
                            "/placeholder-image.jpg",
                        )}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                      {/* 즐겨찾기 버튼 */}
                      <button
                        onClick={(e) => handleFavoriteClick(e, post.id)}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors z-10"
                        aria-label="즐겨찾기 해제"
                      >
                        <Heart
                          className={`h-5 w-5 ${
                            post.isFavorite
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                    </div>

                    <CardContent className="p-4">
                      {/* 제목 */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {post.title}
                      </h3>

                      {/* 카테고리 */}
                      {mainCategory && subCategory && (
                        <div className="text-xs text-gray-500 mb-2">
                          {mainCategory.name} &gt; {subCategory.name}
                        </div>
                      )}

                      {/* 지역 */}
                      {regionNames.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="line-clamp-1">
                            {regionNames
                              .slice(0, MAX_VISIBLE_REGIONS)
                              .join(", ")}
                            {regionNames.length > MAX_VISIBLE_REGIONS &&
                              ` 외 ${regionNames.length - MAX_VISIBLE_REGIONS}개`}
                          </span>
                        </div>
                      )}

                      {/* 수령/반납 방법 */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        {post.receiveMethod && (
                          <span>
                            수령: {RECEIVE_METHOD_LABELS[post.receiveMethod] || post.receiveMethod}
                          </span>
                        )}
                        {post.receiveMethod && post.returnMethod && <span>•</span>}
                        {post.returnMethod && (
                          <span>
                            반납: {RECEIVE_METHOD_LABELS[post.returnMethod] || post.returnMethod}
                          </span>
                        )}
                      </div>

                      {/* 가격 정보 */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-lg font-bold text-blue-600">
                              {post.fee?.toLocaleString() || 0}원/일
                            </p>
                            {post.deposit && post.deposit > 0 && (
                              <p className="text-xs text-gray-500">
                                보증금: {post.deposit.toLocaleString()}원
                              </p>
                            )}
                          </div>
                        </div>
                        {/* 작성자 및 작성일 */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          {post.authorNickname && (
                            <span>{post.authorNickname}</span>
                          )}
                          {post.createdAt && (
                            <span>
                              {format(parseLocalDateString(post.createdAt), "yyyy-MM-dd", {
                                locale: ko,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          {posts.length > 0 && totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page + 1}
                totalPages={totalPages}
                onPageChange={(newPage) => setPage(newPage - 1)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

