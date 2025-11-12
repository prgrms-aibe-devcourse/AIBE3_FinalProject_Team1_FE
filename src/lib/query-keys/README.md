# Query Keys

React Query 키 관리 - `@lukemorales/query-key-factory`를 사용한 타입 안전한 쿼리 키 관리

## 구조

- `query-keys.ts` - 모든 쿼리 키 정의

## 사용 예시

```tsx
import { getQueryKey, queryKeys } from "@/lib/query-keys";

// 쿼리에서 사용
const { data } = useQuery({
  queryKey: getQueryKey(queryKeys.user.me),
  queryFn: () => api.getUser(),
});

// 쿼리 무효화
queryClient.invalidateQueries({
  queryKey: getQueryKey(queryKeys.user.all),
});
```

## 쿼리 키 추가

새로운 도메인 쿼리 키를 추가하려면:

1. `query-keys.ts`에서 새로운 `createQueryKeys` 호출
2. `mergeQueryKeys`에 추가
3. `getQueryKey` 헬퍼 함수로 쿼리 키 추출

## 장점

- 타입 안전성: 쿼리 키가 타입 체크됨
- 중앙 관리: 모든 쿼리 키를 한 곳에서 관리
- 자동 완성: IDE에서 쿼리 키 자동 완성 지원
- 리팩토링 안전: 쿼리 키 변경 시 모든 사용처 자동 업데이트
