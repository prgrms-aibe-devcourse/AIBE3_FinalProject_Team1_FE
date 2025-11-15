/**
 * 이미지 URL 처리 유틸리티
 */

/**
 * 이미지 URL을 정규화합니다.
 * 상대 경로인 경우 API base URL을 추가하고,
 * 절대 경로나 전체 URL인 경우는 그대로 반환합니다.
 */
export function getImageUrl(
  imageUrl: string | null | undefined,
  fallback?: string,
): string {
  if (!imageUrl) {
    return fallback || "/images/placeholder.png";
  }

  // 이미 전체 URL인 경우 (http:// 또는 https://로 시작)
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // 상대 경로인 경우 (/, ./로 시작하거나 경로 형식)
  // API base URL을 앞에 붙여줍니다
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  // /로 시작하는 절대 경로인 경우
  if (imageUrl.startsWith("/")) {
    return `${apiBaseUrl}${imageUrl}`;
  }

  // 상대 경로인 경우
  return `${apiBaseUrl}/${imageUrl}`;
}

/**
 * 이미지 URL이 유효한지 확인합니다.
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // 빈 문자열 체크
  if (url.trim() === "") return false;
  
  return true;
}

