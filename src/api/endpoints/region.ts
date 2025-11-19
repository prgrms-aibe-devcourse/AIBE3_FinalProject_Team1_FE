/**
 * 지역 관련 API 엔드포인트
 */
import type { Region } from "@/types/domain";

import { apiClient } from "@/api/client";

/**
 * 지역 목록 조회
 */
export async function getRegionList(): Promise<Region[]> {
  return apiClient.get<Region[]>("/api/v1/regions");
}

/**
 * 지역 상세 조회
 */
export async function getRegion(regionId: number): Promise<Region> {
  return apiClient.get<Region>(`/api/v1/regions/${regionId}`);
}

/**
 * 지역 트리 조회 (계층 구조)
 */
export async function getRegionTree(): Promise<Region[]> {
  return apiClient.get<Region[]>("/api/v1/regions/tree");
}

/**
 * 지역 생성 (관리자용)
 */
export async function createRegion(data: {
  name: string;
  parentId?: number;
}): Promise<Region> {
  return apiClient.post<Region>("/api/v1/adm/regions", data);
}

/**
 * 지역 수정 (관리자용)
 */
export async function updateRegion(
  regionId: number,
  data: { name: string },
): Promise<Region> {
  return apiClient.patch<Region>(`/api/v1/adm/regions/${regionId}`, data);
}

/**
 * 지역 삭제 (관리자용)
 */
export async function deleteRegion(regionId: number): Promise<void> {
  return apiClient.delete<void>(`/api/v1/adm/regions/${regionId}`);
}
