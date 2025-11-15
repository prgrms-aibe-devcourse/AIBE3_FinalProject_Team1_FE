/**
 * 게시글 즐겨찾기 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/types/api";
import type { PaginatedApiResponse } from "@/types/api";
import type { Post } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import { useUIStore } from "@/store/uiStore";

import {
  checkFavorite,
  getFavoritePosts,
  toggleFavorite,
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
          content: [],
          page: {
            page: 0,
            size: 20,
            totalElements: 0,
            totalPages: 0,
            first: true,
            last: true,
            hasNext: false,
            hasPrevious: false,
            sort: [],
          },
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
 * 즐겨찾기 토글 mutation (optimistic update 적용)
 * POST 요청으로 토글 방식 동작
 */
export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (postId: number) => toggleFavorite(postId),
    // Optimistic update: API 응답 전에 UI 즉시 업데이트
    onMutate: async (postId: number) => {
      // 진행 중인 모든 게시글 관련 쿼리 취소
      await queryClient.cancelQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key) || key.length === 0) return false;
          // ["post", "list", {...}] 또는 ["post", "all"] 등
          return key[0] === "post";
        },
      });

      // 이전 값 저장 (롤백용) - 모든 게시글 목록 쿼리
      const allPostQueries = queryClient.getQueriesData<Post[] | PaginatedApiResponse<Post>>({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key) || key.length === 0) return false;
          // ["post", "list", {...}] 또는 ["post", "all"] 등
          // detail은 제외 (detail은 별도로 처리)
          return key[0] === "post" && key[1] !== "detail";
        },
      });

      // 게시글 상세 쿼리
      const previousPost = queryClient.getQueryData<Post>(
        getQueryKey(queryKeys.post.detail(postId)),
      );

      // 현재 즐겨찾기 상태 확인
      let currentIsFavorite = false;
      if (previousPost) {
        currentIsFavorite = previousPost.isFavorite ?? false;
      } else {
        // 게시글 목록에서 찾기
        for (const [, data] of allPostQueries) {
          if (!data) continue;
          const post = Array.isArray(data)
            ? data.find((p) => p.id === postId)
            : data.content.find((p) => p.id === postId);
          if (post) {
            currentIsFavorite = post.isFavorite ?? false;
            break;
          }
        }
      }

      // Optimistic update: 현재 상태의 반대로 즉시 변경
      const newIsFavorite = !currentIsFavorite;

      // Optimistic update: 모든 게시글 목록 쿼리
      allPostQueries.forEach(([queryKey, data]) => {
        if (!data) return;
        queryClient.setQueryData<Post[] | PaginatedApiResponse<Post>>(
          queryKey,
          (old) => {
            if (!old) return old;
            if (Array.isArray(old)) {
              const updated = old.map((post) =>
                post.id === postId
                  ? { ...post, isFavorite: newIsFavorite }
                  : post,
              );
              return updated;
            }
            const updated = {
              ...old,
              content: old.content.map((post) =>
                post.id === postId
                  ? { ...post, isFavorite: newIsFavorite }
                  : post,
              ),
            };
            return updated;
          },
        );
      });

      // Optimistic update: 게시글 상세
      if (previousPost) {
        queryClient.setQueryData<Post>(
          getQueryKey(queryKeys.post.detail(postId)),
          (old) => (old ? { ...old, isFavorite: newIsFavorite } : old),
        );
      }

      return { allPostQueries, previousPost, currentIsFavorite };
    },
    onSuccess: (response, postId) => {
      // API 응답에서 data (isFavorite) 추출
      const isFavorite = response.data;
      
      // API 응답에 따라 실제 상태 반영 - 모든 게시글 목록 쿼리
      const allPostQueries = queryClient.getQueriesData<Post[] | PaginatedApiResponse<Post>>({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key) || key.length === 0) return false;
          // ["post", "list", {...}] 또는 ["post", "all"] 등
          // detail은 제외 (detail은 별도로 처리)
          return key[0] === "post" && key[1] !== "detail";
        },
      });

      allPostQueries.forEach(([queryKey, data]) => {
        if (!data) return;
        queryClient.setQueryData<Post[] | PaginatedApiResponse<Post>>(
          queryKey,
          (old) => {
            if (!old) return old;
            if (Array.isArray(old)) {
              const updated = old.map((post) =>
                post.id === postId ? { ...post, isFavorite } : post,
              );
              return updated;
            }
            const updated = {
              ...old,
              content: old.content.map((post) =>
                post.id === postId ? { ...post, isFavorite } : post,
              ),
            };
            return updated;
          },
        );
      });

      // 게시글 상세 쿼리 업데이트
      queryClient.setQueryData<Post>(
        getQueryKey(queryKeys.post.detail(postId)),
        (old) => (old ? { ...old, isFavorite } : old),
      );

      // 즐겨찾기 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.favorites),
      });
      
      // 성공 메시지 표시 (API 응답의 msg 사용)
      if (response.msg) {
        showToast(response.msg, "success");
      }
    },
    onError: (error: unknown, postId: number, context) => {
      console.error("Toggle favorite error:", error);
      
      // 롤백: 이전 상태로 복원 - 모든 게시글 목록 쿼리
      if (context?.allPostQueries) {
        context.allPostQueries.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      if (context?.previousPost) {
        queryClient.setQueryData(
          getQueryKey(queryKeys.post.detail(postId)),
          context.previousPost,
        );
      }

      const apiError = error as ApiError;
      const errorMessage =
        apiError.message || "즐겨찾기 토글에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}
