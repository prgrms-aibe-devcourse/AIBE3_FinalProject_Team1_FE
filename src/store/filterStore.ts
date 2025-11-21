/**
 * 필터 및 검색 상태 관리 스토어
 * 게시글, 예약 등의 필터 상태를 관리
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { PostListFilters } from "@/types/domain";

interface FilterState {
  // 게시글 필터
  postFilters: PostListFilters;
  setPostFilters: (filters: Partial<PostListFilters>) => void;
  resetPostFilters: () => void;

  // 검색어
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // 정렬 옵션
  sortBy: string;
  sortOrder: "asc" | "desc";
  setSort: (sortBy: string, order?: "asc" | "desc") => void;
}

const defaultPostFilters: PostListFilters = {
  categoryId: undefined,
  regionId: undefined,
  keyword: undefined,
  minDeposit: undefined,
  maxDeposit: undefined,
  minFee: undefined,
  maxFee: undefined,
  receiveMethod: undefined,
  page: 0,
  size: 20,
  sort: ["createdAt,DESC"],
};

/**
 * 필터 스토어
 * persist middleware를 사용하여 localStorage에 필터 상태 저장
 */
export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      // 게시글 필터
      postFilters: defaultPostFilters,
      setPostFilters: (filters) =>
        set((state) => ({
          postFilters: { ...state.postFilters, ...filters },
        })),
      resetPostFilters: () => set({ postFilters: defaultPostFilters }),

      // 검색어
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

      // 정렬
      sortBy: "createdAt",
      sortOrder: "desc",
      setSort: (sortBy, order = "desc") => set({ sortBy, sortOrder: order }),
    }),
    {
      name: "filter-storage",
      partialize: (state) => ({
        postFilters: state.postFilters,
        searchQuery: state.searchQuery,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    },
  ),
);
