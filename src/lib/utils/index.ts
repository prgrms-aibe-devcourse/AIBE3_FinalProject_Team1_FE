/**
 * 유틸리티 함수들을 모아두는 파일입니다.
 * 필요에 따라 별도 파일로 분리하세요.
 */
import { type ClassValue, clsx } from "clsx";

/**
 * className을 병합하는 함수
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * 날짜를 포맷팅하는 함수 예시
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ko-KR");
}

/**
 * 디바운스 함수 예시
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
