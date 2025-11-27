/**
 * 게시글 목록 페이지
 */
"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import type { Category, Post, ReceiveMethod, Region } from "@/types/domain";

import { parseLocalDateString } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

import { useAuthStore } from "@/store/authStore";
import { useFilterStore } from "@/store/filterStore";

import { useCategoryListQuery } from "@/queries/category";
import { usePostListQuery } from "@/queries/post";
import { useToggleFavoriteMutation } from "@/queries/post-favorite";
import { useRegionListQuery } from "@/queries/region";

import { Filter, Heart, Search, X } from "lucide-react";

/**
 * 게시글 목록 페이지
 */

/**
 * 게시글 목록 페이지
 */

const RECEIVE_METHOD_LABELS: Record<ReceiveMethod, string> = {
  DIRECT: "직거래",
  DELIVERY: "택배",
  ANY: "상관없음",
};

export default function PostsPage() {
  const { postFilters, setPostFilters, resetPostFilters } = useFilterStore();
  const { user } = useAuthStore();
  const [showFilters, setShowFilters] = useState(false);
  const [localKeyword, setLocalKeyword] = useState(postFilters.keyword || "");

  const { data, isLoading } = usePostListQuery(postFilters);
  const { data: categories } = useCategoryListQuery();
  const { data: regions } = useRegionListQuery();
  const toggleFavoriteMutation = useToggleFavoriteMutation();

  // 필터 변경 시 쿼리 업데이트 (debounce 500ms)
  useEffect(() => {
    if (localKeyword !== postFilters.keyword) {
      const timer = setTimeout(() => {
        setPostFilters({ keyword: localKeyword || undefined, page: 0 });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [localKeyword, postFilters.keyword, setPostFilters]);

  // 페이지네이션 응답인 경우 content 배열 추출, 아니면 배열 자체 사용
  // API 실패 시에도 빈 배열로 정상 동작
  const posts = Array.isArray(data) ? data : data?.content || [];
  const hasPosts = posts.length > 0;

  // 카테고리 상위/하위 선택을 위한 상태
  const [selectedMainCategory, setSelectedMainCategory] = useState<
    number | null
  >(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(
    null,
  );

  // 지역 선택을 위한 상태 (시/도, 시/군/구)
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);

  // 대분류 카테고리 (child 배열을 가진 것들)
  const mainCategories = categories || [];
  const selectedMainCategoryData = mainCategories.find(
    (cat) => cat.id === selectedMainCategory,
  );
  const filteredSubCategories =
    selectedMainCategoryData?.child || selectedMainCategoryData?.children || [];

  // 시/도 지역 (child 배열을 가진 것들)
  const provinces = regions || [];
  const selectedProvinceData = provinces.find(
    (province) => province.id === selectedProvince,
  );
  const filteredDistricts =
    selectedProvinceData?.child || selectedProvinceData?.children || [];

  // 카테고리 변경 핸들러
  const handleMainCategoryChange = (categoryId: number | null) => {
    setSelectedMainCategory(categoryId);
    setSelectedSubCategory(null);
    // 대분류 선택 해제 시 필터도 해제
    if (!categoryId) {
      setPostFilters({ categoryId: undefined, page: 0 });
    } else {
      // 대분류 선택 시 필터는 적용하지 않고, 소분류 선택 대기
      setPostFilters({ categoryId: undefined, page: 0 });
    }
  };

  const handleSubCategoryChange = (categoryId: number | null) => {
    setSelectedSubCategory(categoryId);
    // 소분류 선택 시에만 필터 적용 (필수)
    setPostFilters({
      categoryId: categoryId || undefined,
      page: 0,
    });
  };

  // 지역 선택 핸들러 - 시/도 선택 시 해당 시/도 추가
  const handleProvinceSelect = (regionId: number) => {
    const currentRegionIds = postFilters.regionIds || [];
    if (!currentRegionIds.includes(regionId)) {
      setPostFilters({
        regionIds: [...currentRegionIds, regionId],
        page: 0,
      });
    }
  };

  // 지역 선택 핸들러 - 시/군/구 선택 시 해당 시/군/구 추가
  const handleDistrictSelect = (regionId: number) => {
    const currentRegionIds = postFilters.regionIds || [];
    if (!currentRegionIds.includes(regionId)) {
      setPostFilters({
        regionIds: [...currentRegionIds, regionId],
        page: 0,
      });
    }
  };

  // 선택된 카테고리 이름 가져오기 (소분류가 필수이므로 소분류 선택 시에만 표시)
  const getSelectedCategoryName = () => {
    if (selectedSubCategory) {
      const subCategory = filteredSubCategories.find(
        (c) => c.id === selectedSubCategory,
      );
      const mainCategory = mainCategories.find(
        (c) => c.id === selectedMainCategory,
      );
      return mainCategory && subCategory
        ? `${mainCategory.name} > ${subCategory.name}`
        : null;
    }
    return null;
  };

  // 선택된 지역 이름들 가져오기 (부모-자식 관계 포함)
  const getSelectedRegionNames = () => {
    if (!postFilters.regionIds || postFilters.regionIds.length === 0) {
      return [];
    }
    const result: Array<{ id: number; name: string; parentId?: number }> = [];

    for (const id of postFilters.regionIds) {
      // 시/도에서 찾기
      for (const province of provinces) {
        if (province.id === id) {
          // 시/도인 경우, 하위 시/군/구가 선택되어 있는지 확인
          const districts = province.child || province.children || [];
          const hasSelectedDistrict = districts.some((district) =>
            postFilters.regionIds?.includes(district.id),
          );

          // 하위 시/군/구가 선택되어 있지 않으면 시/도만 표시
          if (!hasSelectedDistrict) {
            result.push({ id, name: province.name });
          }
          break;
        }
        // 시/군/구에서 찾기
        const districts = province.child || province.children || [];
        for (const district of districts) {
          if (district.id === id) {
            // 시/군/구인 경우 부모 시/도와 함께 표시
            result.push({
              id,
              name: `${province.name} > ${district.name}`,
              parentId: province.id,
            });
            break;
          }
        }
      }
    }

    return result;
  };

  const handleSortChange = (sort: "createdAt" | "deposit" | "fee") => {
    const currentSort = postFilters.sort || ["createdAt,DESC"];
    const currentOrder = currentSort[0]?.split(",")[1] || "DESC";
    setPostFilters({ sort: [`${sort},${currentOrder}`], page: 0 });
  };

  const handleOrderChange = (order: "asc" | "desc") => {
    const currentSort = postFilters.sort || ["createdAt,DESC"];
    const currentSortField = currentSort[0]?.split(",")[0] || "createdAt";
    const orderUpper = order.toUpperCase();
    setPostFilters({ sort: [`${currentSortField},${orderUpper}`], page: 0 });
  };

  const hasActiveFilters =
    postFilters.categoryId ||
    (postFilters.regionIds && postFilters.regionIds.length > 0) ||
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
                setSelectedMainCategory(null);
                setSelectedSubCategory(null);
                setSelectedProvince(null);
                setSelectedDistrict(null);
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
              {/* 카테고리 - 대분류/소분류 한 줄 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    카테고리 (대분류)
                  </label>
                  <select
                    value={selectedMainCategory || ""}
                    onChange={(e) =>
                      handleMainCategoryChange(
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="">대분류 선택</option>
                    {mainCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    카테고리 (소분류)
                  </label>
                  <select
                    value={selectedSubCategory || ""}
                    onChange={(e) =>
                      handleSubCategoryChange(
                        e.target.value ? parseInt(e.target.value, 10) : null,
                      )
                    }
                    disabled={!selectedMainCategory}
                    required={!!selectedMainCategory}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">소분류 선택</option>
                    {filteredSubCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 지역 - 시/도/시/군/구 한 줄 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    지역 (시/도)
                  </label>
                  <select
                    value={selectedProvince || ""}
                    onChange={(e) => {
                      const provinceId = e.target.value
                        ? parseInt(e.target.value, 10)
                        : null;
                      setSelectedProvince(provinceId);
                      if (provinceId) {
                        // 시/도 선택 시 시/군/구를 "전체"로 자동 선택
                        setSelectedDistrict(null);
                        // "전체" 선택 처리: 시/도만 선택하고 하위 시/군/구 제거
                        const currentRegionIds = postFilters.regionIds || [];
                        const provinceData = provinces.find(
                          (p) => p.id === provinceId,
                        );
                        if (provinceData) {
                          const districts =
                            provinceData.child || provinceData.children || [];
                          // 해당 시/도의 모든 하위 시/군/구 제거
                          const newRegionIds = currentRegionIds.filter(
                            (id) =>
                              id !== provinceId &&
                              !districts.some((d) => d.id === id),
                          );
                          // 시/도 추가
                          if (!newRegionIds.includes(provinceId)) {
                            setPostFilters({
                              regionIds: [...newRegionIds, provinceId],
                              page: 0,
                            });
                          } else {
                            setPostFilters({
                              regionIds:
                                newRegionIds.length > 0
                                  ? newRegionIds
                                  : undefined,
                              page: 0,
                            });
                          }
                        }
                      } else {
                        setSelectedDistrict(null);
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="">시/도 선택</option>
                    {provinces.map((province) => (
                      <option key={province.id} value={province.id}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    지역 (시/군/구)
                  </label>
                  <select
                    value={
                      selectedDistrict === null && selectedProvince
                        ? "all"
                        : selectedDistrict || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "all" && selectedProvince) {
                        // "전체" 선택 시 시/도만 선택하고 하위 시/군/구 제거
                        const currentRegionIds = postFilters.regionIds || [];
                        const newRegionIds = currentRegionIds.filter(
                          (id) =>
                            id !== selectedProvince &&
                            !filteredDistricts.some((d) => d.id === id),
                        );
                        if (!newRegionIds.includes(selectedProvince)) {
                          setPostFilters({
                            regionIds: [...newRegionIds, selectedProvince],
                            page: 0,
                          });
                        } else {
                          setPostFilters({
                            regionIds:
                              newRegionIds.length > 0
                                ? newRegionIds
                                : undefined,
                            page: 0,
                          });
                        }
                        setSelectedDistrict(null);
                      } else {
                        const districtId = value ? parseInt(value, 10) : null;
                        setSelectedDistrict(districtId);
                        if (districtId) {
                          // 시/군/구 선택 시 해당 시/도가 이미 선택되어 있으면 유지, 아니면 추가
                          const currentRegionIds = postFilters.regionIds || [];
                          if (
                            selectedProvince &&
                            !currentRegionIds.includes(selectedProvince)
                          ) {
                            handleProvinceSelect(selectedProvince);
                          }
                          handleDistrictSelect(districtId);
                        }
                      }
                    }}
                    disabled={!selectedProvince}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">시/군/구 선택</option>
                    <option value="all">전체</option>
                    {filteredDistricts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 선택된 필터 Chip 표시 */}
        {(getSelectedCategoryName() || getSelectedRegionNames().length > 0) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {getSelectedCategoryName() && (
              <div className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                <span>카테고리: {getSelectedCategoryName()}</span>
                <button
                  onClick={() => {
                    setSelectedMainCategory(null);
                    setSelectedSubCategory(null);
                    setPostFilters({ categoryId: undefined, page: 0 });
                  }}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {getSelectedRegionNames().map((region) => {
              return (
                <div
                  key={region.id}
                  className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                >
                  <span>{region.name}</span>
                  <button
                    onClick={() => {
                      // 시/군/구를 제거할 때는 해당 시/군/구만 제거
                      // 시/도를 제거할 때는 해당 시/도의 모든 하위 시/군/구도 제거
                      if (region.parentId) {
                        // 시/군/구인 경우 해당 시/군/구만 제거
                        const newRegionIds =
                          postFilters.regionIds?.filter(
                            (id) => id !== region.id,
                          ) || [];
                        setPostFilters({
                          regionIds:
                            newRegionIds.length > 0 ? newRegionIds : undefined,
                          page: 0,
                        });
                        if (region.id === selectedDistrict) {
                          setSelectedDistrict(null);
                        }
                      } else {
                        // 시/도인 경우 해당 시/도와 모든 하위 시/군/구 제거
                        const province = provinces.find(
                          (p) => p.id === region.id,
                        );
                        if (province) {
                          const districts =
                            province.child || province.children || [];
                          const districtIds = districts.map((d) => d.id);
                          const newRegionIds =
                            postFilters.regionIds?.filter(
                              (id) =>
                                id !== region.id && !districtIds.includes(id),
                            ) || [];
                          setPostFilters({
                            regionIds:
                              newRegionIds.length > 0
                                ? newRegionIds
                                : undefined,
                            page: 0,
                          });
                        } else {
                          const newRegionIds =
                            postFilters.regionIds?.filter(
                              (id) => id !== region.id,
                            ) || [];
                          setPostFilters({
                            regionIds:
                              newRegionIds.length > 0
                                ? newRegionIds
                                : undefined,
                            page: 0,
                          });
                        }
                        if (region.id === selectedProvince) {
                          setSelectedProvince(null);
                          setSelectedDistrict(null);
                        }
                      }
                    }}
                    className="ml-1 hover:text-green-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
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
      {isLoading ? (
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
      ) : hasPosts ? (
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

            const isAuthor = user?.id === (post.author?.id ?? post.authorId);

            return (
              <div key={post.id} className="relative">
                <Link href={`/posts/${post.id}`} className="block">
                  <Card className="h-full transition-shadow hover:shadow-lg relative">
                    {/* 즐겨찾기 버튼 */}
                    <button
                      type="button"
                      onClick={handleFavoriteClick}
                      className="absolute right-2 top-2 z-10 rounded-full bg-white bg-opacity-80 p-2 shadow-md hover:bg-opacity-100 transition-all"
                      disabled={toggleFavoriteMutation.isPending || isAuthor}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          (post.isFavorite ?? false)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400"
                        }`}
                      />
                    </button>

                    {/* 썸네일 이미지 */}
                    {(post.thumbnailImageUrl ||
                      (post.images && post.images.length > 0)) && (
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={
                            post.thumbnailImageUrl ||
                            post.images![0].file ||
                            post.images![0].url ||
                            ""
                          }
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
                          {subCategory &&
                            subCategory.id !== mainCategory?.id && (
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
                          <span>📍</span>
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
                              const date = parseLocalDateString(post.createdAt);
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

      {/* 페이지네이션 */}
      {!Array.isArray(data) && data?.page && data.page.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={(postFilters.page ?? 0) + 1}
            totalPages={data.page.totalPages || 1}
            onPageChange={(page) => setPostFilters({ page: page - 1 })}
          />
        </div>
      )}
    </div>
  );
}
