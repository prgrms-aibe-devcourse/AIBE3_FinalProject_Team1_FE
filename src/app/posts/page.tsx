/**
 * 게시글 목록 페이지
 */
"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import type {
  Post,
  ReceiveMethod,
  Category,
  Region,
} from "@/types/domain";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useFilterStore } from "@/store/filterStore";

import { useCategoryListQuery } from "@/queries/category";
import { usePostListQuery } from "@/queries/post";
import { useRegionListQuery } from "@/queries/region";
import { useToggleFavoriteMutation } from "@/queries/post-favorite";

import { Filter, Search, X, Heart } from "lucide-react";

const RECEIVE_METHOD_LABELS: Record<ReceiveMethod, string> = {
  DIRECT: "직거래",
  DELIVERY: "택배",
  ANY: "상관없음",
};

export default function PostsPage() {
  const { postFilters, setPostFilters, resetPostFilters } = useFilterStore();
  const [showFilters, setShowFilters] = useState(false);
  const [localKeyword, setLocalKeyword] = useState(postFilters.keyword || "");

  const { data, isLoading } = usePostListQuery(postFilters);
  const { data: categories } = useCategoryListQuery();
  const { data: regions } = useRegionListQuery();
  const toggleFavoriteMutation = useToggleFavoriteMutation();

  // 필터 변경 시 쿼리 업데이트
  useEffect(() => {
    if (localKeyword !== postFilters.keyword) {
      const timer = setTimeout(() => {
        setPostFilters({ keyword: localKeyword || undefined, page: 1 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [localKeyword, postFilters.keyword, setPostFilters]);

  // 페이지네이션 응답인 경우 content 배열 추출, 아니면 배열 자체 사용
  // API 실패 시에도 빈 배열로 정상 동작
  const posts = Array.isArray(data) ? data : data?.content || [];
  const hasPosts = posts.length > 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
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

  const handleCategoryChange = (categoryId: number | undefined) => {
    setPostFilters({ categoryId, page: 1 });
  };

  const handleRegionChange = (regionId: number | undefined) => {
    setPostFilters({ regionId, page: 1 });
  };

  const handleReceiveMethodChange = (
    receiveMethod: ReceiveMethod | undefined,
  ) => {
    setPostFilters({ receiveMethod, page: 1 });
  };

  const handleMinDepositChange = (value: string) => {
    setPostFilters({
      minDeposit: value ? parseInt(value, 10) : undefined,
      page: 1,
    });
  };

  const handleMaxDepositChange = (value: string) => {
    setPostFilters({
      maxDeposit: value ? parseInt(value, 10) : undefined,
      page: 1,
    });
  };

  const handleMinFeeChange = (value: string) => {
    setPostFilters({
      minFee: value ? parseInt(value, 10) : undefined,
      page: 1,
    });
  };

  const handleMaxFeeChange = (value: string) => {
    setPostFilters({
      maxFee: value ? parseInt(value, 10) : undefined,
      page: 1,
    });
  };

  const handleSortChange = (sort: "createdAt" | "deposit" | "fee") => {
    const currentSort = postFilters.sort || ["createdAt,DESC"];
    const currentOrder = currentSort[0]?.split(",")[1] || "DESC";
    setPostFilters({ sort: [`${sort},${currentOrder}`], page: 1 });
  };

  const handleOrderChange = (order: "asc" | "desc") => {
    const currentSort = postFilters.sort || ["createdAt,DESC"];
    const currentSortField = currentSort[0]?.split(",")[0] || "createdAt";
    const orderUpper = order.toUpperCase();
    setPostFilters({ sort: [`${currentSortField},${orderUpper}`], page: 1 });
  };

  const hasActiveFilters =
    postFilters.categoryId ||
    postFilters.regionId ||
    postFilters.receiveMethod ||
    postFilters.minDeposit ||
    postFilters.maxDeposit ||
    postFilters.minFee ||
    postFilters.maxFee ||
    postFilters.keyword;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">게시글 목록</h1>
        <Link href="/posts/new">
          <Button>게시글 작성</Button>
        </Link>
      </div>

      {/* 검색 및 필터 섹션 */}
      <div className="mb-8 space-y-4">
        {/* 검색바 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="게시글 제목, 내용으로 검색..."
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 필터 토글 버튼 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            필터 {hasActiveFilters && "•"}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetPostFilters();
                setLocalKeyword("");
              }}
              className="flex items-center gap-1 text-sm"
            >
              <X className="h-4 w-4" />
              필터 초기화
            </Button>
          )}
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <Card className="p-4">
            <CardContent className="space-y-4 p-0">
              {/* 카테고리 */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  카테고리
                </label>
                <select
                  value={postFilters.categoryId || ""}
                  onChange={(e) =>
                    handleCategoryChange(
                      e.target.value ? parseInt(e.target.value, 10) : undefined,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">전체</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 지역 */}
              <div>
                <label className="mb-2 block text-sm font-medium">지역</label>
                <select
                  value={postFilters.regionId || ""}
                  onChange={(e) =>
                    handleRegionChange(
                      e.target.value ? parseInt(e.target.value, 10) : undefined,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">전체</option>
                  {regions?.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 수령방식 */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  수령방식
                </label>
                <select
                  value={postFilters.receiveMethod || ""}
                  onChange={(e) =>
                    handleReceiveMethodChange(
                      (e.target.value || undefined) as
                        | ReceiveMethod
                        | undefined,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">전체</option>
                  {Object.entries(RECEIVE_METHOD_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* 보증금 범위 */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  보증금 범위
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="최소"
                    value={postFilters.minDeposit || ""}
                    onChange={(e) => handleMinDepositChange(e.target.value)}
                  />
                  <span className="text-gray-500">~</span>
                  <Input
                    type="number"
                    placeholder="최대"
                    value={postFilters.maxDeposit || ""}
                    onChange={(e) => handleMaxDepositChange(e.target.value)}
                  />
                </div>
              </div>

              {/* 일일 대여료 범위 */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  일일 대여료 범위
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="최소"
                    value={postFilters.minFee || ""}
                    onChange={(e) => handleMinFeeChange(e.target.value)}
                  />
                  <span className="text-gray-500">~</span>
                  <Input
                    type="number"
                    placeholder="최대"
                    value={postFilters.maxFee || ""}
                    onChange={(e) => handleMaxFeeChange(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 총 게시글 수 및 정렬 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {Array.isArray(data) ? (
            <span>총 {data.length}개의 게시글</span>
          ) : data?.page ? (
            <span>총 {data.page.totalElements}개의 게시글</span>
          ) : (
            <span>총 0개의 게시글</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">정렬:</label>
          <select
            value={postFilters.sort?.[0]?.split(",")[0] || "createdAt"}
            onChange={(e) =>
              handleSortChange(
                e.target.value as "createdAt" | "deposit" | "fee",
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="createdAt">등록일</option>
            <option value="deposit">보증금</option>
            <option value="fee">대여료</option>
          </select>
          <select
            value={
              postFilters.sort?.[0]?.split(",")[1]?.toLowerCase() || "desc"
            }
            onChange={(e) =>
              handleOrderChange(e.target.value as "asc" | "desc")
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </div>
      </div>

      {/* 게시글 목록 또는 빈 상태 */}
      {hasPosts ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: Post) => {
            // 카테고리 찾기
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

            // 지역 이름 찾기
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

            // 카테고리 정보 (대분류와 소분류)
            const category = post.categoryId
              ? findCategoryById(post.categoryId)
              : null;
            const mainCategory = category
              ? categories?.find((c) =>
                  c.child?.some((child) => child.id === category.id),
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

            return (
              <div key={post.id} className="relative">
                <Link href={`/posts/${post.id}`} className="block">
                  <Card className="h-full transition-shadow hover:shadow-lg relative">
                  {/* 즐겨찾기 버튼 */}
                  <button
                    type="button"
                    onClick={handleFavoriteClick}
                    className="absolute right-2 top-2 z-10 rounded-full bg-white bg-opacity-80 p-2 shadow-md hover:bg-opacity-100 transition-all"
                    disabled={toggleFavoriteMutation.isPending}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        post.isFavorite ?? false
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>

                  {/* 썸네일 이미지 */}
                  {(post.thumbnailImageUrl || (post.images && post.images.length > 0)) && (
                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                      <Image
                        src={post.thumbnailImageUrl || post.images![0].file || post.images![0].url || ""}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                      {/* 카테고리 배지 (좌측 상단) */}
                      <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
                        {mainCategory && (
                          <span className="rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white">
                            {mainCategory.name}
                          </span>
                        )}
                        {subCategory && subCategory.id !== mainCategory?.id && (
                          <span className="rounded-md bg-blue-400 px-2 py-1 text-xs font-medium text-white">
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
                        수령: {RECEIVE_METHOD_LABELS[post.receiveMethod] || post.receiveMethod}
                      </span>
                      <span>•</span>
                      <span>
                        반납: {RECEIVE_METHOD_LABELS[post.returnMethod] || post.returnMethod}
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
                        <span>📍</span>
                        <span className="line-clamp-1">
                          {regionNames.slice(0, MAX_VISIBLE_REGIONS).join(", ")}
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
                            const date = new Date(post.createdAt);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, "0");
                            const day = String(date.getDate()).padStart(2, "0");
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
      ) : (
        <div className="py-12">
          {/* 빈 상태 메시지 */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              등록된 게시글이 없습니다
            </h2>
            <p className="text-gray-600">
              {hasActiveFilters
                ? "검색 조건에 맞는 게시글이 없습니다. 필터를 조정해보세요."
                : "첫 번째 게시글을 등록해보세요!"}
            </p>
          </div>

          {/* 게시글 등록하기 버튼 */}
          <div className="flex justify-center">
            <Link href="/posts/new">
              <Button size="lg" className="px-8">
                게시글 등록하기
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
