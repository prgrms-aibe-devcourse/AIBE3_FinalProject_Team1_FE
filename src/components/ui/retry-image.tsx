"use client";

import { useEffect, useState, useRef } from "react";
import Image, { ImageProps } from "next/image";

interface RetryImageProps extends Omit<ImageProps, "onError"> {
  maxRetries?: number;
  retryDelay?: number; // 밀리초 단위
  fallbackSrc?: string;
  onRetry?: (attempt: number) => void;
}

/**
 * 이미지 로드 실패 시 자동 재시도하는 Image 컴포넌트
 * 서버에서 이미지 리사이즈 처리 중일 때 유용합니다.
 */
export function RetryImage({
  src,
  maxRetries = 5,
  retryDelay = 1000, // 기본 1초
  fallbackSrc,
  onRetry,
  alt,
  ...props
}: RetryImageProps) {
  const srcString = typeof src === "string" ? src : "";
  const [currentSrc, setCurrentSrc] = useState<string>(srcString);
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // src가 변경되면 상태 초기화
  useEffect(() => {
    const newSrc = typeof src === "string" ? src : "";
    setCurrentSrc(newSrc);
    setRetryCount(0);
    setHasError(false);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [src]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleError = () => {
    if (retryCount < maxRetries) {
      const nextRetryCount = retryCount + 1;
      setRetryCount(nextRetryCount);
      
      // Exponential backoff: 재시도 횟수에 따라 지연 시간 증가
      const delay = retryDelay * Math.pow(1.5, retryCount);
      
      onRetry?.(nextRetryCount);
      
      retryTimeoutRef.current = setTimeout(() => {
        // 캐시 무효화를 위해 쿼리 파라미터 추가
        const srcStr = typeof src === "string" ? src : "";
        const separator = srcStr.includes("?") ? "&" : "?";
        const retryParam = `_retry=${nextRetryCount}&_t=${Date.now()}`;
        setCurrentSrc(`${srcStr}${separator}${retryParam}`);
        setHasError(false);
      }, delay);
    } else {
      // 최대 재시도 횟수 초과 시 fallback 이미지 또는 에러 상태 표시
      setHasError(true);
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
      }
    }
  };

  // 에러 상태이고 fallback이 없으면 placeholder 표시
  if (hasError && !fallbackSrc) {
    // rounded-full 클래스가 있으면 원형이므로 텍스트를 짧게 표시
    const isRounded = props.className?.includes("rounded-full");
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${
          props.fill ? "absolute inset-0" : ""
        } ${isRounded ? "rounded-full" : ""}`}
        style={props.fill ? undefined : { width: "100%", height: "100%" }}
      >
        {isRounded ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600 mb-0.5"></div>
            <span className="text-[10px] leading-tight text-center whitespace-nowrap">로딩 중</span>
          </>
        ) : (
          <span className="text-xs">불러오는 중입니다</span>
        )}
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt || "이미지"}
      onError={handleError}
      // 재시도 중일 때는 로딩 상태 표시를 위해 unoptimized 사용 고려
      // (필요시 props로 전달 가능)
    />
  );
}

