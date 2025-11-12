/**
 * 게시글 즐겨찾기 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { PaginatedApiResponse } from "@/types/api";
import type { Post } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  addFavorite,
  checkFavorite,
  getFavoritePosts,
  removeFavorite,
} from "@/api/endpoints/post-favorite";

/**
 * 즐겨찾기한 게시글 목록 조회 query
 */
export function useFavoritePostsQuery(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.post.favorites),
    queryFn: async (): Promise<PaginatedApiResponse<Post>> => {
      try {
        return await getFavoritePosts(filters);
      } catch (error) {
        // API 실패 시 빈 페이지네이션 응답 반환
        console.error("Failed to fetch favorite posts:", error);
        return {
          data: [],
          total: 0,
          page: 1,
          size: 20,
          totalPages: 0,
          status: 200,
        };
      }
    },
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
    retry: false, // 재시도하지 않음
  });
}

/**
 * 즐겨찾기 여부 확인 query
 */
export function useFavoriteCheckQuery(postId: number) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.post.detail(postId)),
    queryFn: async (): Promise<boolean> => {
      try {
        const response = await checkFavorite(postId);
        return response.isFavorite;
      } catch (error) {
        // API 실패 시 false 반환하여 정상 동작
        console.error("Failed to check favorite:", error);
        return false;
      }
    },
    enabled: !!postId, // postId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 1, // 1분간 fresh 상태 유지
    retry: false, // 재시도하지 않음
  });
}

/**
 * 즐겨찾기 추가 mutation
 */
export function useAddFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => addFavorite(postId),
    onSuccess: (_, postId) => {
      // 즐겨찾기 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.favorites),
      });
      // 게시글 상세 쿼리 업데이트 (isFavorite 필드)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.detail(postId)),
      });
    },
    onError: (error) => {
      console.error("Add favorite error:", error);
    },
  });
}

/**
 * 즐겨찾기 제거 mutation
 */
export function useRemoveFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => removeFavorite(postId),
    onSuccess: (_, postId) => {
      // 즐겨찾기 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.favorites),
      });
      // 게시글 상세 쿼리 업데이트 (isFavorite 필드)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.detail(postId)),
      });
    },
    onError: (error) => {
      console.error("Remove favorite error:", error);
    },
  });
}
