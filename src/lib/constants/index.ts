/**
 * 상수들을 모아두는 파일입니다.
 * 필요에 따라 별도 파일로 분리하세요.
 */

/**
 * API 기본 URL
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

/**
 * 환경 변수
 */
export const ENV = {
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
} as const;

/**
 * 앱 설정
 */
export const APP_CONFIG = {
  NAME: "취밋",
  VERSION: "0.1.0",
} as const;

