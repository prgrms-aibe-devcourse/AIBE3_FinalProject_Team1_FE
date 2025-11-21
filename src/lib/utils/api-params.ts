/**
 * API 파라미터 유틸리티 함수
 */

/**
 * 필터 객체를 URLSearchParams로 변환
 * page, size, sort는 쿼리 파라미터로 직접 전송
 */
export function buildQueryParams(
  filters?: Record<string, unknown>,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters) {
    // 모든 필터 파라미터 처리 (page, size, sort 포함)
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // 배열은 여러 개의 파라미터로 변환
          value.forEach((item) => {
            params.append(key, String(item));
          });
        } else {
          params.append(key, String(value));
        }
      }
    });
  }
  return params;
}
