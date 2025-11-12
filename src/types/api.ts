/**
 * API 관련 타입 정의
 */

/**
 * API 응답 기본 타입
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedApiResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  message?: string;
  status: number;
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
