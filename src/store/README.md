# Store

Zustand를 사용한 전역 상태 관리 스토어입니다.

## 스토어 목록

### 1. `authStore` - 인증 상태 관리

사용자 인증 정보를 관리합니다.

```tsx
import { useAuthStore } from "@/store/authStore";

function MyComponent() {
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();

  // 사용자 정보 확인
  if (isAuthenticated) {
    console.log(user?.nickname);
  }
}
```

**상태:**

- `user`: 현재 로그인한 사용자 정보 (`MemberResponse | null`)
- `isAuthenticated`: 인증 여부 (`boolean`)

**액션:**

- `setAuth(user)`: 사용자 인증 정보 설정
- `setUser(user)`: 사용자 정보 업데이트
- `logout()`: 로그아웃 처리

**특징:**

- `localStorage`에 자동 저장 (persist middleware)

---

### 2. `uiStore` - UI 상태 관리

모달, 사이드바, 토스트 알림 등의 UI 상태를 관리합니다.

```tsx
import { Modal } from "@/components/ui/modal";

import { useUIStore } from "@/store/uiStore";

function MyComponent() {
  const { openModal, closeModal, showToast } = useUIStore();

  const handleClick = () => {
    openModal(<div>모달 내용</div>);
  };

  const handleSuccess = () => {
    showToast("성공했습니다!", "success");
  };
}
```

**상태:**

- `isModalOpen`: 모달 열림 여부
- `modalContent`: 모달 내용
- `isSidebarOpen`: 사이드바 열림 여부
- `toast`: 토스트 알림 정보
- `isLoading`: 전역 로딩 상태

**액션:**

- `openModal(content)`: 모달 열기
- `closeModal()`: 모달 닫기
- `toggleSidebar()`: 사이드바 토글
- `setSidebarOpen(open)`: 사이드바 열림 상태 설정
- `showToast(message, type)`: 토스트 알림 표시
- `hideToast()`: 토스트 알림 숨기기
- `setLoading(loading)`: 전역 로딩 상태 설정

---

### 3. `filterStore` - 필터 및 검색 상태 관리

게시글, 예약 등의 필터 상태를 관리합니다.

```tsx
import { useFilterStore } from "@/store/filterStore";

function PostListPage() {
  const { postFilters, setPostFilters, searchQuery, setSearchQuery } =
    useFilterStore();

  const handleCategoryChange = (categoryId: number) => {
    setPostFilters({ categoryId });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPostFilters({ page: 1 }); // 검색 시 첫 페이지로
  };
}
```

**상태:**

- `postFilters`: 게시글 필터 옵션 (`PostListFilters`)
- `searchQuery`: 검색어 (`string`)
- `sortBy`: 정렬 기준 (`string`)
- `sortOrder`: 정렬 순서 (`"asc" | "desc"`)

**액션:**

- `setPostFilters(filters)`: 게시글 필터 설정
- `resetPostFilters()`: 게시글 필터 초기화
- `setSearchQuery(query)`: 검색어 설정
- `setSort(sortBy, order)`: 정렬 옵션 설정

**특징:**

- `localStorage`에 자동 저장 (persist middleware)
- 페이지 새로고침 후에도 필터 상태 유지

---

### 4. `selectionStore` - 선택 상태 관리

게시글, 예약 등의 선택된 항목을 관리합니다.

```tsx
import { useSelectionStore } from "@/store/selectionStore";

function PostListPage() {
  const { selectedPostIds, togglePostSelection, clearPostSelection } =
    useSelectionStore();

  const handleSelect = (postId: number) => {
    togglePostSelection(postId);
  };

  const handleDeleteSelected = () => {
    // 선택된 게시글 삭제
    selectedPostIds.forEach((id) => deletePost(id));
    clearPostSelection();
  };
}
```

**상태:**

- `selectedPostIds`: 선택된 게시글 ID 목록 (`number[]`)
- `selectedReservationIds`: 선택된 예약 ID 목록 (`number[]`)

**액션:**

- `togglePostSelection(postId)`: 게시글 선택 토글
- `setPostSelection(postIds)`: 게시글 선택 설정
- `clearPostSelection()`: 게시글 선택 해제
- `toggleReservationSelection(reservationId)`: 예약 선택 토글
- `setReservationSelection(reservationIds)`: 예약 선택 설정
- `clearReservationSelection()`: 예약 선택 해제
- `clearAll()`: 전체 선택 해제

---

## 통합 사용 예시

```tsx
import { useAuthStore, useFilterStore, useUIStore } from "@/store";

function MyComponent() {
  // 여러 스토어 동시 사용
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const { postFilters, setPostFilters } = useFilterStore();

  const handleSubmit = async () => {
    try {
      // API 호출
      await createPost(postFilters);
      showToast("게시글이 생성되었습니다!", "success");
    } catch (error) {
      showToast("오류가 발생했습니다.", "error");
    }
  };

  return <div>...</div>;
}
```

---

## 주의사항

1. **서버 컴포넌트에서 사용 불가**: Zustand는 클라이언트 전용이므로 `"use client"` 지시어가 필요합니다.

2. **타입 안전성**: 모든 스토어는 TypeScript로 타입이 정의되어 있어 타입 안전하게 사용할 수 있습니다.

3. **성능 최적화**: 필요한 상태만 선택적으로 구독하여 불필요한 리렌더링을 방지합니다.

```tsx
// ❌ 나쁜 예: 전체 스토어 구독
const store = useAuthStore();

// ✅ 좋은 예: 필요한 상태만 구독
const { user } = useAuthStore();
```
