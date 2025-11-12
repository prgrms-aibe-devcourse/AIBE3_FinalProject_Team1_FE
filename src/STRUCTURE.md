# 프로젝트 폴더 구조

## 현재 구조

```
src/
├── app/                    # Next.js App Router (라우팅)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/             # 재사용 가능한 컴포넌트
│   ├── ui/                # 기본 UI 컴포넌트 (버튼, 입력 등)
│   └── layout/            # 레이아웃 컴포넌트 (Header, Footer 등)
│
├── lib/                   # 라이브러리 설정 및 유틸리티
│   ├── utils/             # 유틸리티 함수
│   └── constants/         # 상수
│
├── hooks/                 # 커스텀 React 훅
│
├── api/                   # API 클라이언트
│   ├── client.ts          # API 클라이언트 설정
│   └── endpoints/         # 엔드포인트별 함수
│
├── store/                 # 상태 관리
│
├── queries/               # React Query 쿼리
│
├── types/                 # TypeScript 타입 정의
│
└── services/              # 비즈니스 로직 서비스
    └── socket/            # Socket 서비스
```

## 폴더별 역할

### `app/`

- Next.js App Router의 라우팅 구조
- 페이지와 레이아웃 파일

### `components/`

- 재사용 가능한 컴포넌트
- `ui/`: 기본 UI 컴포넌트 (버튼, 입력 등)
- `layout/`: 레이아웃 컴포넌트 (Header, Footer 등)

### `lib/`

- 라이브러리 설정 및 유틸리티 함수
- `utils/`: 유틸리티 함수 (formatDate, debounce 등)
- `constants/`: 상수 (API URL, 환경 변수 등)

### `hooks/`

- 커스텀 React 훅
- 예: `useAuth`, `useSocket`

### `api/`

- API 클라이언트 설정 및 엔드포인트 함수
- `client.ts`: API 클라이언트 설정
- `endpoints/`: 엔드포인트별 함수

### `store/`

- 상태 관리 스토어
- 예: `authStore`, `userStore`

### `queries/`

- React Query 쿼리
- 예: `useUserQuery`, `useAuthQuery`

### `types/`

- TypeScript 타입 정의
- 예: `api.ts`, `domain.ts`

### `services/`

- 비즈니스 로직 서비스
- 예: `socket/`, `auth/`

## Import 경로 예시

```tsx
// 컴포넌트
// 타입
import type { User } from "@/types/domain";

// 유틸리티
import { formatDate } from "@/lib/utils/date";

import { API_URL } from "@/lib/constants/api";

import { Button } from "@/components/ui/button";

import { Header } from "@/components/layout/header";

// 훅
import { useAuth } from "@/hooks/useAuth";

// API
import { apiClient } from "@/api/client";
import { login } from "@/api/endpoints/auth";

// 상태 관리
import { useAuthStore } from "@/store/authStore";

// 쿼리
import { useUserQuery } from "@/queries/user";

// 서비스
import { socketService } from "@/services/socket/client";
```

## 마이그레이션 가이드

기존 `global` 폴더에서 새 구조로 마이그레이션:

- `global/api` → `api/`
- `global/consts` → `lib/constants/`
- `global/libs` → `lib/utils/`
- `global/queries` → `queries/`
- `global/socket` → `services/socket/`
- `global/stores` → `store/`

## 다음 단계

1. `global` 폴더 삭제 (비어있음)
2. 기존 코드의 import 경로 업데이트
3. 각 폴더에 실제 파일 추가
