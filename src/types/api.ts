/**
 * API 관련 타입 정의
 */

/**
 * API 응답 기본 타입
 */
export interface ApiResponse<T = unknown> {
  data: T;
  msg?: string;
  message?: string; // 하위 호환성을 위해 유지
  status: number;
}

/**
 * 정렬 정보
 */
export interface SortInfo {
  property: string;
  direction: "ASC" | "DESC";
}

/**
 * 페이지 정보
 */
export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  sort: SortInfo[];
}

/**
 * 페이지네이션 응답 (Spring Data Page 형식)
 * API 응답의 data 필드에 포함되는 구조
 * 외부 래퍼: { status, msg, data: PaginatedApiResponse }
 */
export interface PaginatedApiResponse<T = unknown> {
  content: T[];
  page: PageInfo;
}

/**
 * API 에러 타입
 */
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

/**
 * 파일 업로드 응답
 */
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}
