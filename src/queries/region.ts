/**
 * 지역 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiResponse } from "@/types/api";
import type { Region } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  createRegion,
  deleteRegion,
  getRegion,
  getRegionList,
  getRegionTree,
  updateRegion,
} from "@/api/endpoints/region";

/**
 * 지역 목록 조회 query
 */
export function useRegionListQuery() {
  return useQuery({
    queryKey: getQueryKey(queryKeys.region.all),
    queryFn: async (): Promise<Region[]> => {
      try {
        return await getRegionList();
      } catch (error) {
        // API 실패 시 빈 배열 반환하여 정상 동작
        console.error("Failed to fetch region list:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 30, // 30분간 fresh 상태 유지 (지역은 자주 변경되지 않음)
    retry: false, // 재시도하지 않음
  });
}

/**
 * 지역 상세 조회 query
 */
export function useRegionQuery(regionId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.region.detail(regionId)),
    queryFn: async (): Promise<Region> => {
      const response = await getRegion(regionId);
      return response;
    },
    enabled: !!regionId, // regionId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 30, // 30분간 fresh 상태 유지
  });
}

/**
 * 지역 트리 조회 query (계층 구조)
 */
export function useRegionTreeQuery() {
  return useQuery({
    queryKey: getQueryKey(queryKeys.region.tree),
    queryFn: async (): Promise<Region[]> => {
      const response = await getRegionTree();
      return response;
    },
    staleTime: 1000 * 60 * 30, // 30분간 fresh 상태 유지
  });
}

/**
 * 지역 생성 mutation (관리자용)
 */
export function useCreateRegionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; parentId?: number }) =>
      createRegion(data),
    onSuccess: () => {
      // 지역 목록 및 트리 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.region.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.region.tree),
      });
    },
    onError: (error) => {
      console.error("Create region error:", error);
    },
  });
}

/**
 * 지역 수정 mutation (관리자용)
 */
export function useUpdateRegionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      regionId,
      data,
    }: {
      regionId: number;
      data: { name?: string; parentId?: number };
    }) => updateRegion(regionId, data),
    onSuccess: (response, variables) => {
      // 지역 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.region.detail(variables.regionId)),
        response,
      );
      // 지역 목록 및 트리 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.region.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.region.tree),
      });
      // 해당 지역의 게시글 목록 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.byRegion(variables.regionId)),
      });
    },
    onError: (error) => {
      console.error("Update region error:", error);
    },
  });
}

/**
 * 지역 삭제 mutation (관리자용)
 */
export function useDeleteRegionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (regionId: number) => deleteRegion(regionId),
    onSuccess: (_, regionId) => {
      // 지역 상세 쿼리 제거
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.region.detail(regionId)),
      });
      // 지역 목록 및 트리 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.region.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.region.tree),
      });
      // 해당 지역의 게시글 목록 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.byRegion(regionId)),
      });
    },
    onError: (error) => {
      console.error("Delete region error:", error);
    },
  });
}

