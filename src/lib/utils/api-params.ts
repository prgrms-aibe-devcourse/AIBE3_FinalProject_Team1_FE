/**
 * API 파라미터 유틸리티 함수
 */

/**
 * 필터 객체를 URLSearchParams로 변환
 * page, size, sort는 pageable 객체로 감싸서 전송
 */
export function buildQueryParams(
  filters?: Record<string, unknown>,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters) {
    const { page, size, sort, ...otherFilters } = filters;

    // pageable 파라미터 처리
    if (page !== undefined && page !== null) {
      params.append("pageable.page", String(page));
    }
    if (size !== undefined && size !== null) {
      params.append("pageable.size", String(size));
    }
    if (sort !== undefined && sort !== null) {
      if (Array.isArray(sort)) {
        // sort 배열은 여러 개의 pageable.sort 파라미터로 변환
        sort.forEach((sortItem) => {
          params.append("pageable.sort", String(sortItem));
        });
      } else {
        params.append("pageable.sort", String(sort));
      }
    }

    // 나머지 필터 파라미터 처리
    Object.entries(otherFilters).forEach(([key, value]) => {
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
