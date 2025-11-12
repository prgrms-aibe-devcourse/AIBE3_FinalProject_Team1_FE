/**
 * 게시글 관련 React Query 쿼리
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiResponse, PaginatedApiResponse } from "@/types/api";
import type {
  CreatePostDto,
  Post,
  PostListFilters,
  UpdatePostDto,
} from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

import {
  createPost,
  deletePost,
  getMyPosts,
  getPost,
  getPostList,
  getPostsByCategory,
  getPostsByRegion,
  updatePost,
} from "@/api/endpoints/post";

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
        return await getPostList(filters);
      } catch (error) {
        // API 실패 시 빈 배열 반환하여 정상 동작
        console.error("Failed to fetch post list:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 2, // 2분간 fresh 상태 유지
    retry: false, // 재시도하지 않음
  });
}

/**
 * 게시글 상세 조회 query
 */
export function usePostQuery(postId: number) {
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
    enabled: !!postId, // postId가 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
    retry: false, // 재시도하지 않음
  });
}

/**
 * 내 게시글 목록 조회 query
 */
export function useMyPostsQuery(filters?: PostListFilters) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.post.myPosts),
    queryFn: async (): Promise<PaginatedApiResponse<Post>> => {
      try {
        return await getMyPosts(filters);
      } catch (error) {
        // API 실패 시 빈 페이지네이션 응답 반환
        console.error("Failed to fetch my posts:", error);
        return { data: [], total: 0, page: 1, size: 20, totalPages: 0, status: 200 };
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

  return useMutation({
    mutationFn: (data: CreatePostDto) => createPost(data),
    onSuccess: () => {
      // 게시글 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.myPosts),
      });
    },
    onError: (error) => {
      console.error("Create post error:", error);
    },
  });
}

/**
 * 게시글 수정 mutation
 */
export function useUpdatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: number; data: UpdatePostDto }) =>
      updatePost(postId, data),
    onSuccess: (response, variables) => {
      // 게시글 상세 쿼리 업데이트
      queryClient.setQueryData(
        getQueryKey(queryKeys.post.detail(variables.postId)),
        response,
      );
      // 게시글 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.myPosts),
      });
    },
    onError: (error) => {
      console.error("Update post error:", error);
    },
  });
}

/**
 * 게시글 삭제 mutation
 */
export function useDeletePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: number) => deletePost(postId),
    onSuccess: (_, postId) => {
      // 게시글 상세 쿼리 제거
      queryClient.removeQueries({
        queryKey: getQueryKey(queryKeys.post.detail(postId)),
      });
      // 게시글 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.all),
      });
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.post.myPosts),
      });
    },
    onError: (error) => {
      console.error("Delete post error:", error);
    },
  });
}
