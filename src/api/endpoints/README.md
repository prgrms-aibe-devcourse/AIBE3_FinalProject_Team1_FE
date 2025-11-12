# API Endpoints

각 도메인별로 엔드포인트 함수를 관리하는 폴더입니다.

## 구조

```
endpoints/
├── auth.ts          # 인증 관련 API
├── user.ts          # 사용자 관련 API (예정)
├── your-domain.ts   # 도메인별 API
└── ...
```

## 파일 생성 규칙

1. **도메인별로 파일 분리**: 하나의 도메인당 하나의 파일
2. **명확한 네이밍**: 도메인 이름으로 파일명 지정
3. **타입 안전성**: 모든 함수에 타입 정의
4. **에러 처리**: API 클라이언트에서 통합 처리

## 예시

```typescript
/**
 * 도메인 관련 API 엔드포인트
 */
import type { ApiResponse } from "@/types/api";
import type { YourDomain } from "@/types/domain";

import { apiClient } from "@/api/client";

/**
 * 도메인 목록 조회
 */
export async function getYourDomainList(
  filters?: Record<string, unknown>,
): Promise<ApiResponse<YourDomain[]>> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  const endpoint = `/your-domain${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<YourDomain[]>(endpoint);
}

/**
 * 도메인 상세 조회
 */
export async function getYourDomain(
  id: string,
): Promise<ApiResponse<YourDomain>> {
  return apiClient.get<YourDomain>(`/your-domain/${id}`);
}

/**
 * 도메인 생성
 */
export async function createYourDomain(
  data: CreateYourDomainDto,
): Promise<ApiResponse<YourDomain>> {
  return apiClient.post<YourDomain>("/your-domain", data);
}

/**
 * 도메인 수정
 */
export async function updateYourDomain(
  id: string,
  data: UpdateYourDomainDto,
): Promise<ApiResponse<YourDomain>> {
  return apiClient.put<YourDomain>(`/your-domain/${id}`, data);
}

/**
 * 도메인 삭제
 */
export async function deleteYourDomain(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/your-domain/${id}`);
}
```

## 주의사항

- 모든 함수는 `async` 함수로 작성
- 반환 타입은 `Promise<ApiResponse<T>>` 형식
- 요청 파라미터는 명확한 타입으로 정의
- 주석으로 각 함수의 용도 설명
