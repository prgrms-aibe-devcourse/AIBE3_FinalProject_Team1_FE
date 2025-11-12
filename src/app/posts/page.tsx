/**
 * 게시글 목록 페이지
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePostListQuery } from "@/queries/post";
import { useCategoryListQuery } from "@/queries/category";
import { useRegionListQuery } from "@/queries/region";
import { useFilterStore } from "@/store/filterStore";
import type { Post, ReceiveMethod } from "@/types/domain";

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

  // 필터 변경 시 쿼리 업데이트
  useEffect(() => {
    if (localKeyword !== postFilters.keyword) {
      const timer = setTimeout(() => {
        setPostFilters({ keyword: localKeyword || undefined, page: 1 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [localKeyword, postFilters.keyword, setPostFilters]);

  // 페이지네이션 응답인 경우 data 배열 추출, 아니면 배열 자체 사용
  // API 실패 시에도 빈 배열로 정상 동작
  const posts = Array.isArray(data) ? data : data?.data || [];
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

  const handleReceiveMethodChange = (receiveMethod: ReceiveMethod | undefined) => {
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
    setPostFilters({ sort, page: 1 });
  };

  const handleOrderChange = (order: "asc" | "desc") => {
    setPostFilters({ order, page: 1 });
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
                <label className="mb-2 block text-sm font-medium">카테고리</label>
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
                <label className="mb-2 block text-sm font-medium">수령방식</label>
                <select
                  value={postFilters.receiveMethod || ""}
                  onChange={(e) =>
                    handleReceiveMethodChange(
                      (e.target.value || undefined) as ReceiveMethod | undefined,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">전체</option>
                  {Object.entries(RECEIVE_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 보증금 범위 */}
              <div>
                <label className="mb-2 block text-sm font-medium">보증금 범위</label>
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
                <label className="mb-2 block text-sm font-medium">일일 대여료 범위</label>
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

              {/* 정렬 */}
              <div>
                <label className="mb-2 block text-sm font-medium">정렬</label>
                <div className="flex items-center gap-2">
                  <select
                    value={postFilters.sort || "createdAt"}
                    onChange={(e) =>
                      handleSortChange(
                        e.target.value as "createdAt" | "deposit" | "fee",
                      )
                    }
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="createdAt">등록일</option>
                    <option value="deposit">보증금</option>
                    <option value="fee">대여료</option>
                  </select>
                  <select
                    value={postFilters.order || "desc"}
                    onChange={(e) =>
                      handleOrderChange(e.target.value as "asc" | "desc")
                    }
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="desc">내림차순</option>
                    <option value="asc">오름차순</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 게시글 목록 또는 빈 상태 */}
      {hasPosts ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: Post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                {post.images && post.images.length > 0 && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={post.images[0].url}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="mb-2 text-lg font-semibold line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-blue-600">
                      보증금: {post.deposit.toLocaleString()}원
                    </span>
                    <span className="text-gray-500">
                      {post.fee.toLocaleString()}원/일
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
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

