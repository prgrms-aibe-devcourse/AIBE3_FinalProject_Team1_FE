/**
 * 유틸리티 함수들을 모아두는 파일입니다.
 * 필요에 따라 별도 파일로 분리하세요.
 */
import { type ClassValue, clsx } from "clsx";

export * from "./notification";

/**
 * className을 병합하는 함수
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * 서버에서 받은 UTC 날짜 문자열을 로컬 시간으로 올바르게 변환
 * 서버가 UTC로 보내는 경우를 가정하고 로컬 시간으로 변환
 */
export function parseLocalDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) {
    return dateStr;
  }

  // 서버가 UTC로 보내는 경우
  // 시간대 정보가 없으면 UTC로 명시적으로 파싱
  if (
    dateStr.includes("T") &&
    !dateStr.includes("Z") &&
    !dateStr.includes("+") &&
    !dateStr.includes("-", 10)
  ) {
    // "2025-01-15T10:30:00" 형식을 UTC로 명시적으로 파싱
    // 끝에 "Z"를 추가하여 UTC임을 명시
    return new Date(dateStr + "Z");
  }
  // 이미 시간대 정보가 있으면 그대로 파싱
  return new Date(dateStr);
}

/**
 * 날짜를 포맷팅하는 함수 예시
 */
export function formatDate(date: Date | string): string {
  const d = parseLocalDate(date);
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
