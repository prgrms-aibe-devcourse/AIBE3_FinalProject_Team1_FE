/**
 * 카테고리 관련 API 엔드포인트
 */
import type { Category } from "@/types/domain";

import { apiClient } from "@/api/client";

/**
 * 카테고리 목록 조회
 */
export async function getCategoryList(): Promise<Category[]> {
  return apiClient.get<Category[]>("/api/v1/categories");
}

/**
 * 카테고리 상세 조회
 */
export async function getCategory(categoryId: number): Promise<Category> {
  return apiClient.get<Category>(`/api/v1/categories/${categoryId}`);
}

/**
 * 카테고리 트리 조회 (계층 구조)
 */
export async function getCategoryTree(): Promise<Category[]> {
  return apiClient.get<Category[]>("/api/v1/categories/tree");
}

/**
 * 카테고리 생성 (관리자용)
 */
export async function createCategory(data: {
  name: string;
  parentId?: number;
}): Promise<Category> {
  return apiClient.post<Category>("/api/v1/adm/categories", data);
}

/**
 * 카테고리 수정 (관리자용)
 */
export async function updateCategory(
  categoryId: number,
  data: { name: string },
): Promise<Category> {
  return apiClient.put<Category>(`/api/v1/adm/categories/${categoryId}`, data);
}

/**
 * 카테고리 삭제 (관리자용)
 */
export async function deleteCategory(categoryId: number): Promise<void> {
  return apiClient.delete<void>(`/api/v1/adm/categories/${categoryId}`);
}
