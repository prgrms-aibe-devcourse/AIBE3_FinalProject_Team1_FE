/**
 * 게시글 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, PaginatedApiResponse } from "@/types/api";
import type {
  AISearchResponse,
  CreatePostDto,
  GenPostDetailResBody,
  Post,
  PostListFilters,
  UpdatePostDto,
} from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  createPost,
  deletePost,
  generatePostDetail,
  getMyPosts,
  getPost,
  getPostList,
  getPostsByCategory,
  getPostsByRegion,
  searchPostsByAI,
  updatePost,
} from "@/api/endpoints/post";

import { useUIStore } from "@/store/uiStore";

/**
 * 게시글 목록 조회 query
 */
export function usePostListQuery(filters?: PostListFilters) {
  return useQuery({
    queryKey: getQueryKey(
      queryKeys.post.list(filters as Record<string, unknown> | undefined),
    ),
    queryFn: async (): Promise<Post[] | PaginatedApiResponse<Post>> => {
      try {
        const result = await getPostList(filters);
        // undefined 체크
        if (result === undefined) {
          console.warn(
            "getPostList returned undefined, returning empty paginated response",
          );
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
        return result;
      } catch (error) {
        // API 실패 시 빈 페이지네이션 응답 반환하여 정상 동작
        console.error("Failed to fetch post list:", error);
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
    staleTime: 0, // 항상 최신 데이터로 업데이트
    retry: false, // 재시도하지 않음
  });
}

/**
 * 게시글 상세 조회 query
 */
export function usePostQuery(postId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.post.detail(postId)),
    queryFn: async (): Promise<Post | null> => {
      try {
        return await getPost(postId);
      } catch (error) {
        // API 실패 시 null 반환하여 정상 동작
        console.error("Failed to fetch post:", error);
        return null;
      }
    },
    enabled: options?.enabled !== false && !!postId, // postId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    retry: false, // 재시도하지 않음
  });
}

/**
 * 내 게시글 목록 조회 query
 */
export function useMyPostsQuery(filters?: PostListFilters) {
  return useQuery({
    queryKey: getQueryKey(
      queryKeys.post.myPosts(filters as Record<string, unknown> | undefined),
    ),
    queryFn: async (): Promise<PaginatedApiResponse<Post>> => {
      try {
        return await getMyPosts(filters);
      } catch (error) {
        // API 실패 시 빈 페이지네이션 응답 반환
        console.error("Failed to fetch my posts:", error);
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
 * 카테고리별 게시글 목록 조회 query
 */
export function usePostsByCategoryQuery(
  categoryId: number,
  filters?: PostListFilters,
) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.post.byCategory(categoryId)),
    queryFn: async (): Promise<PaginatedApiResponse<Post>> => {
      return getPostsByCategory(categoryId, filters);
    },
    enabled: !!categoryId, // categoryId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
  });
}

/**
 * 지역별 게시글 목록 조회 query
 */
export function usePostsByRegionQuery(
  regionId: number,
  filters?: PostListFilters,
) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.post.byRegion(regionId)),
    queryFn: async (): Promise<PaginatedApiResponse<Post>> => {
      return getPostsByRegion(regionId, filters);
    },
    enabled: !!regionId, // regionId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
  });
}

/**
 * 게시글 생성 mutation
 */
export function useCreatePostMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (data: CreatePostDto | FormData) => createPost(data),
    onSuccess: () => {
      // 게시글 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.myPosts()),
      });
      showToast("게시글이 생성되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Create post error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "게시글 생성에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 게시글 수정 mutation
 */
export function useUpdatePostMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({ postId, data }: { postId: number; data: UpdatePostDto }) =>
      updatePost(postId, data),
    onSuccess: async (response, variables) => {
      // 1. 게시글 상세 쿼리에 업데이트된 데이터 즉시 설정
      queryClient.setQueryData(
        getQueryKey(queryKeys.post.detail(variables.postId)),
        response,
      );

      // 2. 게시글 목록 쿼리 무효화 및 강제 refetch
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getQueryKey(queryKeys.post.all),
        }),
        queryClient.invalidateQueries({
          queryKey: getQueryKey(queryKeys.post.list()),
        }),
        queryClient.invalidateQueries({
          queryKey: getQueryKey(queryKeys.post.myPosts()),
        }),
      ]);

      // 3. 상세 페이지 쿼리도 무효화하여 최신 데이터 보장
      await queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.detail(variables.postId)),
      });

      showToast("게시글이 수정되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Update post error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "게시글 수정에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * 게시글 삭제 mutation
 */
export function useDeletePostMutation() {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: (postId: number) => deletePost(postId),
    onSuccess: (_, postId) => {
      // 게시글 상세 쿼리 제거
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.post.detail(postId)),
      });
      // 게시글 목록 쿼리 무효화 (모든 필터 조합 포함)
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.list()),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.myPosts()),
      });
      showToast("게시글이 삭제되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Delete post error:", error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || "게시글 삭제에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}

/**
 * AI 검색 query
 */
export function useAISearchQuery(query: string | null) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.post.search(query || "")),
    queryFn: async (): Promise<AISearchResponse | null> => {
      if (!query || query.trim() === "") {
        return null;
      }
      try {
        const result = await searchPostsByAI(query);
        if (process.env.NODE_ENV === "development") {
          console.log("[useAISearchQuery] Search result:", result);
        }
        return result;
      } catch (error) {
        console.error("Failed to search posts by AI:", error);
        throw error; // React Query가 에러를 처리하도록 throw
      }
    },
    enabled: !!query && query.trim() !== "",
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    retry: false,
  });
}

/**
 * AI 게시글 생성 mutation
 */
export function useGeneratePostDetailMutation() {
  const showToast = useUIStore((state) => state.showToast);

  return useMutation({
    mutationFn: ({
      imageFiles,
      additionalInfo,
    }: {
      imageFiles: File[];
      additionalInfo?: string;
    }) => generatePostDetail(imageFiles, additionalInfo),
    onSuccess: () => {
      showToast("AI 게시글 생성이 완료되었습니다.", "success");
    },
    onError: (error: unknown) => {
      console.error("Generate post detail error:", error);
      const apiError = error as ApiError;
      const errorMessage =
        apiError.message || "AI 게시글 생성에 실패했습니다.";
      showToast(errorMessage, "error");
    },
  });
}
