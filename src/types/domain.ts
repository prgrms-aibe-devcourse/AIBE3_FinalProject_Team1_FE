/**
 * 도메인 모델 타입 정의
 * ERD 기반 타입 정의
 */

/**
 * BaseEntity - 공통 필드
 */
export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 사용자 권한
 */
export enum MemberRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

/**
 * 사용자 (Member)
 */
export interface Member extends BaseEntity {
  email: string;
  password: string; // API 응답에서는 제외
  name: string;
  phoneNumber: string;
  address1: string; // 도로명 주소
  address2: string; // 상세주소
  nickname: string;
  isBanned: boolean;
  profileImgUrl: string | null;
  role: MemberRole;
}

/**
 * 사용자 응답 (비밀번호 제외)
 */
export type MemberResponse = Omit<Member, "password">;

/**
 * 사용자 생성 DTO
 */
export interface CreateMemberDto {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  address1: string;
  address2: string;
  nickname: string;
}

/**
 * 사용자 수정 DTO
 */
export interface UpdateMemberDto {
  name?: string;
  phoneNumber?: string;
  address1?: string;
  address2?: string;
  nickname?: string;
  profileImgUrl?: string;
}

/**
 * 인증 타입 (쿠키 기반 인증 사용)
 * 토큰은 HttpOnly 쿠키로 관리되므로 응답에는 사용자 정보만 포함
 * @deprecated 로그인/회원가입 응답은 MemberResponse를 직접 반환
 */
export interface Auth {
  user: MemberResponse;
}

/**
 * 신고 타입
 */
export enum ReportType {
  POST = "POST",
  USER = "USER",
  REVIEW = "REVIEW",
}

/**
 * 신고 (Report)
 */
export interface Report extends BaseEntity {
  reportType: ReportType;
  targetId: number;
  comment: string;
  memberId: number;
}

/**
 * 신고 생성 DTO
 */
export interface CreateReportDto {
  reportType: ReportType;
  targetId: number;
  comment: string;
}

/**
 * 알림 타입
 */
export enum NotificationType {
  RESER = "RESER", // 예약
  REVIEW = "REVIEW", // 후기
  CHAT = "CHAT", // 채팅
}

/**
 * 알림 (Notification)
 */
export interface Notification extends BaseEntity {
  targetType: NotificationType;
  targetId: number;
  memberId: number;
  isRead?: boolean; // 프론트엔드에서 사용
}

/**
 * 카테고리 (Category)
 */
export interface Category extends BaseEntity {
  name: string;
  parentId: number | null;
  children?: Category[]; // 하위 카테고리 (프론트엔드에서 사용)
}

/**
 * 지역 (Region)
 */
export interface Region extends BaseEntity {
  name: string;
  parentId: number | null;
  children?: Region[]; // 하위 지역 (프론트엔드에서 사용)
}

/**
 * 게시글 수령/반납 방식
 */
export enum ReceiveMethod {
  DIRECT = "DIRECT", // 직거래
  DELIVERY = "DELIVERY", // 택배
  ANY = "ANY", // 상관없음
}

/**
 * 게시글 (Post)
 */
export interface Post extends BaseEntity {
  title: string;
  content: string; // 장비정보 텍스트로 작성
  deposit: number; // 보증금
  fee: number; // 1일 대여금
  receiveMethod: ReceiveMethod; // 수령방식
  returnMethod: ReceiveMethod; // 반납 방식
  returnAddress1: string | null; // 반납 도로명 주소
  returnAddress2: string | null; // 반납 상세주소
  isBanned: boolean;
  authorId: number;
  categoryId: number;
  // 관계 데이터 (API 응답에 포함될 수 있음)
  author?: MemberResponse;
  category?: Category;
  images?: PostImg[];
  regions?: Region[];
  options?: PostOption[];
  favoriteCount?: number;
  isFavorite?: boolean; // 현재 사용자가 즐겨찾기 했는지
}

/**
 * 게시글 생성 DTO
 */
export interface CreatePostDto {
  title: string;
  content: string;
  deposit: number;
  fee: number;
  receiveMethod: ReceiveMethod;
  returnMethod: ReceiveMethod;
  returnAddress1?: string;
  returnAddress2?: string;
  categoryId: number;
  regionIds: number[]; // 지역 ID 배열
  optionIds?: number[]; // 옵션 ID 배열 (선택)
  imageUrls: string[]; // 이미지 URL 배열
}

/**
 * 게시글 수정 DTO
 */
export interface UpdatePostDto {
  title?: string;
  content?: string;
  deposit?: number;
  fee?: number;
  receiveMethod?: ReceiveMethod;
  returnMethod?: ReceiveMethod;
  returnAddress1?: string;
  returnAddress2?: string;
  categoryId?: number;
  regionIds?: number[];
  optionIds?: number[];
  imageUrls?: string[];
}

/**
 * 게시글 목록 조회 필터
 */
export interface PostListFilters {
  categoryId?: number;
  regionId?: number;
  keyword?: string;
  minDeposit?: number;
  maxDeposit?: number;
  minFee?: number;
  maxFee?: number;
  receiveMethod?: ReceiveMethod;
  page?: number;
  size?: number;
  sort?: "createdAt" | "deposit" | "fee"; // 정렬 기준
  order?: "asc" | "desc"; // 정렬 순서
}

/**
 * 게시글 이미지 (PostImg)
 */
export interface PostImg extends BaseEntity {
  isPrimary: boolean; // 대표이미지 여부
  url: string;
  postId: number;
}

/**
 * 게시글 옵션 (PostOption)
 */
export interface PostOption extends BaseEntity {
  name: string;
  deposit: number; // 옵션에 따라 보증금+됨
  fee: number; // 옵션에 따라 대여금+됨
  postId: number;
}

/**
 * 게시글 지역 (PostRegion)
 */
export interface PostRegion extends BaseEntity {
  postId: number;
  regionsId: number;
  region?: Region; // 관계 데이터
}

/**
 * 게시글 즐겨찾기 (PostFavorite)
 */
export interface PostFavorite extends BaseEntity {
  postId: number;
  memberId: number;
}

/**
 * 예약 상태
 */
export enum ReservationStatus {
  PENDING = "PENDING", // 대기중
  APPROVED = "APPROVED", // 승인됨
  REJECTED = "REJECTED", // 거절됨
  COMPLETED = "COMPLETED", // 완료됨
  CANCELLED = "CANCELLED", // 취소됨
}

/**
 * 예약 (Reservation)
 */
export interface Reservation extends BaseEntity {
  status: ReservationStatus;
  receiveMethod: ReceiveMethod | null; // 수령 방법
  receiveCarrier: string | null; // 수령 택배사
  receiveTrackingNumber: string | null; // 수령 택배번호
  receiveAddress1: string | null; // 수령 도로명 주소
  receiveAddress2: string | null; // 수령 상세주소
  returnMethod: ReceiveMethod | null; // 반납 방법
  returnCarrier: string | null; // 반납 택배사
  returnTrackingNumber: string | null; // 반납 택배번호
  cancelReason: string | null; // 예약 취소 사유
  rejectReason: string | null; // 승인 거절 사유
  reservationStartAt: Date | null; // 대여시작일
  reservationEndAt: Date | null; // 대여종료일
  postId: number;
  authorId: number;
  // 관계 데이터
  post?: Post;
  author?: MemberResponse;
  options?: ReservationOption[];
  review?: Review;
}

/**
 * 예약 생성 DTO
 */
export interface CreateReservationDto {
  postId: number;
  receiveMethod: ReceiveMethod;
  receiveAddress1?: string;
  receiveAddress2?: string;
  returnMethod?: ReceiveMethod;
  returnAddress1?: string;
  returnAddress2?: string;
  reservationStartAt: Date;
  reservationEndAt: Date;
  optionIds?: number[]; // 선택한 옵션 ID 배열
}

/**
 * 예약 수정 DTO (상태 변경 등)
 */
export interface UpdateReservationDto {
  status?: ReservationStatus;
  receiveMethod?: ReceiveMethod;
  receiveCarrier?: string;
  receiveTrackingNumber?: string;
  receiveAddress1?: string;
  receiveAddress2?: string;
  returnMethod?: ReceiveMethod;
  returnCarrier?: string;
  returnTrackingNumber?: string;
  cancelReason?: string;
  rejectReason?: string;
  reservationStartAt?: Date;
  reservationEndAt?: Date;
  optionIds?: number[];
}

/**
 * 예약 로그 (ReservationLog)
 */
export interface ReservationLog extends BaseEntity {
  status: ReservationStatus;
  reservationId: number;
}

/**
 * 예약 옵션 (ReservationOption)
 */
export interface ReservationOption extends BaseEntity {
  reservationId: number;
  optionId: number;
  option?: PostOption; // 관계 데이터
}

/**
 * 후기 (Review)
 */
export interface Review extends BaseEntity {
  equipmentScore: number; // 장비평점 (0-5)
  kindnessScore: number; // 친절도평점 (0-5)
  responseTimeScore: number; // 응답시간평점 (0-5)
  comment: string; // 리뷰내용
  isBanned: boolean;
  reservationId: number;
  // 관계 데이터
  reservation?: Reservation;
  member?: MemberResponse; // 작성자 (예약자)
}

/**
 * 후기 생성 DTO
 */
export interface CreateReviewDto {
  reservationId: number;
  equipmentScore: number;
  kindnessScore: number;
  responseTimeScore: number;
  comment: string;
}

/**
 * 후기 수정 DTO
 */
export interface UpdateReviewDto {
  equipmentScore?: number;
  kindnessScore?: number;
  responseTimeScore?: number;
  comment?: string;
}

/**
 * 채팅방 (ChatRoom)
 */
export interface ChatRoom extends BaseEntity {
  postId: number;
  // 관계 데이터
  post?: Post;
  members?: ChatMember[];
  messages?: ChatMessage[];
  lastMessage?: ChatMessage; // 마지막 메시지 (프론트엔드에서 사용)
  unreadCount?: number; // 읽지 않은 메시지 수 (프론트엔드에서 사용)
}

/**
 * 채팅 참여자 (ChatMember)
 */
export interface ChatMember extends BaseEntity {
  chatRoomId: number;
  memberId: number;
  // 관계 데이터
  member?: MemberResponse;
  chatRoom?: ChatRoom;
}

/**
 * 채팅 메시지 (ChatMessage)
 */
export interface ChatMessage extends BaseEntity {
  content: string;
  chatRoomId: number;
  chatMemberId: number;
  // 관계 데이터
  chatMember?: ChatMember;
  chatRoom?: ChatRoom;
}

/**
 * 채팅 메시지 생성 DTO
 */
export interface CreateChatMessageDto {
  chatRoomId: number;
  content: string;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
