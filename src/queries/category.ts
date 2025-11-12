/**
 * 카테고리 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiResponse } from "@/types/api";
import type { Category } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  createCategory,
  deleteCategory,
  getCategory,
  getCategoryList,
  getCategoryTree,
  updateCategory,
} from "@/api/endpoints/category";

/**
 * 카테고리 목록 조회 query
 */
export function useCategoryListQuery() {
  return useQuery({
    queryKey: getQueryKey(queryKeys.category.all),
    queryFn: async (): Promise<Category[]> => {
      try {
        return await getCategoryList();
      } catch (error) {
        // API 실패 시 빈 배열 반환하여 정상 동작
        console.error("Failed to fetch category list:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 30, // 30분간 fresh 상태 유지 (카테고리는 자주 변경되지 않음)
    retry: false, // 재시도하지 않음
  });
}

/**
 * 카테고리 상세 조회 query
 */
export function useCategoryQuery(categoryId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.category.detail(categoryId)),
    queryFn: async (): Promise<Category> => {
      const response = await getCategory(categoryId);
      return response;
    },
    enabled: !!categoryId, // categoryId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 30, // 30분간 fresh 상태 유지
  });
}

/**
 * 카테고리 트리 조회 query (계층 구조)
 */
export function useCategoryTreeQuery() {
  return useQuery({
    queryKey: getQueryKey(queryKeys.category.tree),
    queryFn: async (): Promise<Category[]> => {
      const response = await getCategoryTree();
      return response;
    },
    staleTime: 1000 * 60 * 30, // 30분간 fresh 상태 유지
  });
}

/**
 * 카테고리 생성 mutation (관리자용)
 */
export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; parentId?: number }) =>
      createCategory(data),
    onSuccess: () => {
      // 카테고리 목록 및 트리 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.category.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.category.tree),
      });
    },
    onError: (error) => {
      console.error("Create category error:", error);
    },
  });
}

/**
 * 카테고리 수정 mutation (관리자용)
 */
export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: number;
      data: { name?: string; parentId?: number };
    }) => updateCategory(categoryId, data),
    onSuccess: (response, variables) => {
      // 카테고리 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.category.detail(variables.categoryId)),
        response,
      );
      // 카테고리 목록 및 트리 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.category.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.category.tree),
      });
      // 해당 카테고리의 게시글 목록 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(
          queryKeys.post.byCategory(variables.categoryId),
        ),
      });
    },
    onError: (error) => {
      console.error("Update category error:", error);
    },
  });
}

/**
 * 카테고리 삭제 mutation (관리자용)
 */
export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: number) => deleteCategory(categoryId),
    onSuccess: (_, categoryId) => {
      // 카테고리 상세 쿼리 제거
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.category.detail(categoryId)),
      });
      // 카테고리 목록 및 트리 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.category.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.category.tree),
      });
      // 해당 카테고리의 게시글 목록 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.byCategory(categoryId)),
      });
    },
    onError: (error) => {
      console.error("Delete category error:", error);
    },
  });
}

