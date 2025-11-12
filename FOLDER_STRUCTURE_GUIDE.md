# 프론트엔드 폴더 구조 개선 가이드

## 현재 구조
```
src/
├── app/          # Next.js App Router (라우팅)
└── global/       # 공용 기능
    ├── api/
    ├── consts/
    ├── libs/
    ├── queries/
    ├── socket/
    └── stores/
```

## 개선안: 기능별 구조 (Feature-based Structure)

Next.js 커뮤니티에서 널리 사용되는 표준 구조입니다.

### 구조
```
src/
├── app/                    # Next.js App Router (라우팅) - 유지
│   ├── (auth)/            # 라우트 그룹 예시
│   ├── (dashboard)/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/             # 재사용 가능한 컴포넌트
│   ├── ui/                # 기본 UI 컴포넌트 (버튼, 입력 등)
│   ├── layout/            # 레이아웃 컴포넌트 (Header, Footer 등)
│   └── features/          # 기능별 컴포넌트
│
├── lib/                   # 라이브러리 설정 및 유틸리티
│   ├── utils/             # 유틸리티 함수
│   ├── validations/       # 검증 로직
│   └── constants/         # 상수 (기존 global/consts)
│
├── hooks/                 # 커스텀 React 훅
│   ├── useAuth.ts
│   └── useSocket.ts
│
├── api/                   # API 클라이언트 (기존 global/api)
│   ├── client.ts          # API 클라이언트 설정
│   └── endpoints/         # 엔드포인트별 함수
│
├── store/                 # 상태 관리 (기존 global/stores)
│   ├── authStore.ts
│   └── userStore.ts
│
├── queries/               # React Query 쿼리 (기존 global/queries)
│   ├── auth.ts
│   └── user.ts
│
├── types/                 # TypeScript 타입 정의
│   ├── api.ts
│   └── domain.ts
│
└── services/              # 비즈니스 로직 서비스
    ├── socket/            # Socket 서비스 (기존 global/socket)
    └── auth/
```

### 장점
- ✅ Next.js 커뮤니티 표준 구조
- ✅ 각 폴더의 역할이 명확함
- ✅ 파일 찾기가 쉬움
- ✅ 확장성이 좋음
- ✅ `global` 대신 더 명확한 네이밍

### 단점
- ❌ 기능이 많아지면 루트 폴더가 복잡해질 수 있음

---

## 대안 1: 도메인 기반 구조 (Domain-driven Structure)

프로젝트가 큰 경우 도메인별로 구조화하는 방법입니다.

### 구조
```
src/
├── app/                    # Next.js App Router
│
├── shared/                 # 공용 코드
│   ├── components/        # 공용 컴포넌트
│   ├── lib/               # 공용 유틸리티
│   ├── hooks/             # 공용 훅
│   └── types/             # 공용 타입
│
└── features/              # 도메인별 기능
    ├── auth/
    │   ├── components/
    │   ├── api/
    │   ├── hooks/
    │   ├── store/
    │   └── types/
    │
    ├── user/
    │   ├── components/
    │   ├── api/
    │   ├── hooks/
    │   └── store/
    │
    └── chat/              # 예: 소켓 관련 기능
        ├── components/
        ├── hooks/
        ├── socket/
        └── store/
```

### 장점
- ✅ 기능별로 응집도가 높음
- ✅ 독립적인 개발 가능
- ✅ 대규모 프로젝트에 적합
- ✅ 기능 삭제/이동이 쉬움

### 단점
- ❌ 공용 코드 관리가 복잡할 수 있음
- ❌ 작은 프로젝트에는 오버엔지니어링

---

## 대안 2: 하이브리드 구조 (Hybrid Structure)

기능별 구조에 도메인 개념을 일부 적용한 구조입니다.

### 구조
```
src/
├── app/                    # Next.js App Router
│
├── components/             # 공용 컴포넌트
│   ├── ui/                # 기본 UI
│   └── layout/            # 레이아웃
│
├── lib/                    # 공용 라이브러리
│   ├── utils/
│   └── constants/
│
├── api/                    # API 클라이언트
│   ├── client.ts
│   └── endpoints/
│       ├── auth.ts
│       └── user.ts
│
├── features/              # 기능별 모듈
│   ├── auth/
│   │   ├── components/    # auth 전용 컴포넌트
│   │   ├── hooks/
│   │   ├── store/
│   │   └── types/
│   │
│   └── chat/
│       ├── components/
│       ├── hooks/
│       ├── socket/
│       └── store/
│
├── hooks/                 # 공용 훅
├── store/                 # 공용 상태 관리
└── types/                 # 공용 타입
```

### 장점
- ✅ 공용 코드와 기능 코드의 균형
- ✅ 중규모 프로젝트에 적합
- ✅ 점진적 확장 가능

### 단점
- ❌ 공용/기능 코드 구분 기준이 모호할 수 있음

---

## 추천 구조

**현재 프로젝트 규모에 따라:**

1. **작은 프로젝트 (~10개 페이지 이하)**
   → **기능별 구조 (Feature-based)** 추천

2. **중규모 프로젝트 (10-50개 페이지)**
   → **하이브리드 구조 (Hybrid)** 추천

3. **대규모 프로젝트 (50개 페이지 이상)**
   → **도메인 기반 구조 (Domain-driven)** 추천

---

## 마이그레이션 체크리스트

기존 `global` 폴더를 새 구조로 이동:

- [ ] `global/api` → `api/`
- [ ] `global/consts` → `lib/constants/`
- [ ] `global/libs` → `lib/utils/` 또는 `lib/`
- [ ] `global/queries` → `queries/`
- [ ] `global/socket` → `services/socket/` 또는 `features/chat/socket/`
- [ ] `global/stores` → `store/`
- [ ] import 경로 업데이트
- [ ] tsconfig.json path alias 확인
- [ ] .prettierrc importOrder 업데이트

---

## 참고 자료

- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [Next.js 프로젝트 구조 가이드](https://nextjs.org/docs/getting-started/project-structure)
- [React 프로젝트 구조 모범 사례](https://react.dev/learn/thinking-in-react)

