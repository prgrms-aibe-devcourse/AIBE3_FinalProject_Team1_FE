# API 명세 템플릿

Notion에서 API 명세를 작성할 때 사용할 템플릿입니다.

## 사용 방법

1. 각 엔드포인트마다 다음 형식으로 작성
2. 프론트엔드 개발 시 이 명세를 참고하여 코드 작성
3. 변경사항 발생 시 명세 업데이트

---

## 엔드포인트 명세 형식

### 기본 정보

- **엔드포인트**: `GET /api/your-domain/:id`
- **설명**: 특정 도메인 정보 조회
- **인증**: 필요 (Bearer Token)
- **권한**: 일반 사용자

### 요청

#### Path Parameters

| 파라미터 | 타입   | 필수 | 설명      |
| -------- | ------ | ---- | --------- |
| id       | string | 예   | 도메인 ID |

#### Query Parameters

| 파라미터 | 타입   | 필수   | 설명               |
| -------- | ------ | ------ | ------------------ |
| include  | string | 아니오 | 포함할 관련 데이터 |

#### Request Body

```json
{
  "name": "string",
  "description": "string"
}
```

### 응답

#### 200 OK

```json
{
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Success",
  "status": 200
}
```

#### 400 Bad Request

```json
{
  "message": "Validation error",
  "status": 400,
  "errors": {
    "name": ["Name is required"]
  }
}
```

#### 401 Unauthorized

```json
{
  "message": "Unauthorized",
  "status": 401
}
```

#### 404 Not Found

```json
{
  "message": "Not found",
  "status": 404
}
```

#### 500 Internal Server Error

```json
{
  "message": "Internal server error",
  "status": 500
}
```

---

## 도메인별 명세 예시

### 인증 (Auth)

#### POST /api/auth/login

- **설명**: 로그인
- **인증**: 불필요

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200**:

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "string",
      "email": "user@example.com",
      "name": "User Name"
    }
  },
  "message": "Login successful",
  "status": 200
}
```

#### POST /api/auth/logout

- **설명**: 로그아웃
- **인증**: 필요

**Response 200**:

```json
{
  "data": null,
  "message": "Logout successful",
  "status": 200
}
```

#### POST /api/auth/signup

- **설명**: 회원가입
- **인증**: 불필요

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response 200**:

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "string",
      "email": "user@example.com",
      "name": "User Name"
    }
  },
  "message": "Signup successful",
  "status": 200
}
```

### 사용자 (User)

#### GET /api/users/me

- **설명**: 현재 로그인한 사용자 정보 조회
- **인증**: 필요

**Response 200**:

```json
{
  "data": {
    "id": "string",
    "email": "user@example.com",
    "name": "User Name",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Success",
  "status": 200
}
```

#### PUT /api/users/me

- **설명**: 현재 로그인한 사용자 정보 수정
- **인증**: 필요

**Request Body**:

```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

**Response 200**:

```json
{
  "data": {
    "id": "string",
    "email": "updated@example.com",
    "name": "Updated Name",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "User updated successfully",
  "status": 200
}
```

---

## 명세 작성 체크리스트

- [ ] 엔드포인트 URL 명확히 정의
- [ ] HTTP 메서드 지정
- [ ] 인증 필요 여부 명시
- [ ] 요청 파라미터 타입 및 필수 여부 명시
- [ ] 응답 데이터 구조 정의
- [ ] 에러 응답 케이스 정의
- [ ] 예시 데이터 제공
- [ ] 설명 및 주의사항 작성

---

## 프론트엔드 코드 생성 가이드

이 명세를 바탕으로 다음을 생성합니다:

1. **타입 정의** (`src/types/domain.ts`)
2. **API 엔드포인트 함수** (`src/api/endpoints/`)
3. **React Query 쿼리** (`src/queries/`)
4. **Query Key** (`src/lib/query-keys.ts`)

명세를 공유해주시면 자동으로 코드를 생성해드립니다!
