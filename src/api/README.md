# API 명세 기반 프론트엔드 코드 생성 가이드

## 현재 구조

```
src/api/
├── client.ts              # API 클라이언트 (공통)
├── endpoints/             # 엔드포인트별 함수
│   └── auth.ts           # 인증 관련 API
└── types/                 # API 타입 정의 (필요시)
```

## API 명세 추가 방법

### 1. Notion API 명세에서 정보 추출

Notion 페이지에서 다음 정보를 확인하세요:
- 엔드포인트 URL
- HTTP 메서드 (GET, POST, PUT, DELETE, PATCH)
- 요청 파라미터 (Path, Query, Body)
- 응답 데이터 구조
- 인증 필요 여부
- 에러 응답 구조

### 2. 타입 정의 추가

`src/types/domain.ts`에 도메인 타입 추가:

```typescript
export interface YourDomain {
  id: string;
  // ... 필드 정의
}
```

### 3. 엔드포인트 함수 추가

`src/api/endpoints/` 폴더에 새 파일 생성:

```typescript
import { apiClient } from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type { YourDomain } from "@/types/domain";

// GET 예시
export async function getYourDomain(id: string): Promise<ApiResponse<YourDomain>> {
  return apiClient.get<YourDomain>(`/your-domain/${id}`);
}

// POST 예시
export async function createYourDomain(data: CreateYourDomainDto): Promise<ApiResponse<YourDomain>> {
  return apiClient.post<YourDomain>("/your-domain", data);
}
```

### 4. React Query 쿼리 추가

`src/queries/` 폴더에 새 파일 생성:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getYourDomain, createYourDomain } from "@/api/endpoints/your-domain";
import { queryKeys, getQueryKey } from "@/lib/query-keys";
import type { YourDomain } from "@/types/domain";

export function useYourDomainQuery(id: string) {
  return useQuery({
    queryKey: getQueryKey(queryKeys.yourDomain.detail(id)),
    queryFn: () => getYourDomain(id),
  });
}

export function useCreateYourDomainMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createYourDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getQueryKey(queryKeys.yourDomain.all),
      });
    },
  });
}
```

### 5. Query Key 추가

`src/lib/query-keys.ts`에 쿼리 키 추가:

```typescript
export const yourDomainKeys = createQueryKeys("yourDomain", {
  all: null,
  detail: (id: string) => [id],
  list: (filters?: Record<string, unknown>) => [filters ?? {}],
});

export const queryKeys = mergeQueryKeys(
  authKeys,
  userKeys,
  yourDomainKeys, // 추가
);
```

## API 명세 템플릿

Notion에서 API 명세를 작성할 때 다음 형식을 사용하세요:

### 엔드포인트 명세

```
## GET /api/your-domain/:id
**설명**: 특정 도메인 정보 조회

**인증**: 필요 (Bearer Token)

**요청**:
- Path Parameters:
  - id: string (필수)
- Query Parameters:
  - include?: string (선택)

**응답**:
- 200 OK:
  {
    "data": {
      "id": "string",
      "name": "string",
      ...
    },
    "message": "string",
    "status": 200
  }
- 404 Not Found:
  {
    "message": "Not found",
    "status": 404
  }
```

## 자동 생성 스크립트 (향후 추가 예정)

API 명세를 바탕으로 자동으로 코드를 생성하는 스크립트를 만들 수 있습니다:
- OpenAPI/Swagger 스펙 → 타입 생성
- Notion API → 코드 생성
- JSON Schema → 타입 생성

## 다음 단계

1. Notion API 명세 확인
2. 도메인별로 엔드포인트 파일 생성
3. 타입 정의 추가
4. React Query 쿼리 추가
5. 컴포넌트에서 사용

## 도움 요청

API 명세를 공유해주시면:
- 타입 정의 자동 생성
- 엔드포인트 함수 자동 생성
- React Query 쿼리 자동 생성
- 컴포넌트 예시 코드 제공
