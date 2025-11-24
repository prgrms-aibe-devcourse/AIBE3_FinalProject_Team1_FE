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
  address1: string;
  address2: string;
  nickname: string;
  phoneNumber: string;
  removeProfileImage: boolean;
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
 * 알림 그룹 타입
 */
export enum NotificationGroupType {
  RESERVATION = "RESERVATION",
}

/**
 * 알림 타입
 */
export enum NotificationType {
  RESERVATION_PENDING_APPROVAL = "RESERVATION_PENDING_APPROVAL", // 예약 : 승인 대기
  RESERVATION_PENDING_PAYMENT = "RESERVATION_PENDING_PAYMENT", // 예약 : 결제 대기
  RESERVATION_PENDING_PICKUP = "RESERVATION_PENDING_PICKUP", // 예약 : 수령 대기
  RESERVATION_SHIPPING = "RESERVATION_SHIPPING", // 예약 : 배송 중
  RESERVATION_INSPECTING_RENTAL = "RESERVATION_INSPECTING_RENTAL", // 예약 : 대여 검수
  RESERVATION_RENTING = "RESERVATION_RENTING", // 예약 : 대여 중
  RESERVATION_PENDING_RETURN = "RESERVATION_PENDING_RETURN", // 예약 : 반납 대기
  RESERVATION_RETURNING = "RESERVATION_RETURNING", // 예약 : 반납 중
  RESERVATION_RETURN_COMPLETED = "RESERVATION_RETURN_COMPLETED", // 예약 : 반납 완료
  RESERVATION_INSPECTING_RETURN = "RESERVATION_INSPECTING_RETURN", // 예약 : 반납 검수
  RESERVATION_PENDING_REFUND = "RESERVATION_PENDING_REFUND", // 예약 : 환급 예정
  RESERVATION_REFUND_COMPLETED = "RESERVATION_REFUND_COMPLETED", // 예약 : 환급 완료
  RESERVATION_LOST_OR_UNRETURNED = "RESERVATION_LOST_OR_UNRETURNED", // 예약 : 미반납/분실
  RESERVATION_CLAIMING = "RESERVATION_CLAIMING", // 예약 : 청구 진행
  RESERVATION_CLAIM_COMPLETED = "RESERVATION_CLAIM_COMPLETED", // 예약 : 청구 완료
  RESERVATION_REJECTED = "RESERVATION_REJECTED", // 예약 : 승인 거절
  RESERVATION_CANCELLED = "RESERVATION_CANCELLED", // 예약 : 예약 취소
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
 * 읽지 않은 알림 여부 응답 DTO
 */
export interface NotificationUnreadResBody {
  hasUnread: boolean;
}

/**
 * 알림 데이터 기본 인터페이스
 * 구체적인 알림 데이터 타입들이 이를 확장합니다.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NotificationData {
  // 마커 인터페이스: 구체적인 알림 데이터 타입들이 이를 확장
}

/**
 * 알림 응답 DTO
 */
export interface NotificationResBody<
  T extends NotificationData = NotificationData,
> {
  id: number;
  notificationType: NotificationType;
  createdAt: Date | string; // API 응답은 문자열일 수 있음
  isRead: boolean;
  data: T;
}

/**
 * 작성자 정보 (알림용)
 */
export interface Author {
  id: number;
  nickname: string;
}

/**
 * 게시글 정보 (알림용)
 */
export interface PostInfo {
  id: number;
  title: string;
  author: Author;
}

/**
 * 예약 정보 (알림용)
 */
export interface ReservationInfo {
  id: number;
  author: Author;
  startDate: Date | string; // API 응답은 문자열일 수 있음
  endDate: Date | string; // API 응답은 문자열일 수 있음
  cancelReason: string | null;
  rejectReason: string | null;
}

/**
 * 예약 알림 데이터
 */
export interface ReservationNotificationData extends NotificationData {
  postInfo: PostInfo;
  reservationInfo: ReservationInfo;
}

/**
 * 카테고리 (Category)
 */
export interface Category extends BaseEntity {
  name: string;
  parentId?: number | null;
  child?: Category[]; // 하위 카테고리 (API 응답 형식)
  children?: Category[]; // 하위 카테고리 (프론트엔드에서 사용, child의 별칭)
}

/**
 * 지역 (Region)
 */
export interface Region extends BaseEntity {
  name: string;
  parentId?: number | null;
  child?: Region[]; // 하위 지역 (API 응답 형식)
  children?: Region[]; // 하위 지역 (프론트엔드에서 사용, child의 별칭)
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
  regionIds?: number[]; // 지역 ID 배열 (API 응답)
  thumbnailImageUrl?: string; // 썸네일 이미지 URL (API 응답)
  authorNickname?: string; // 작성자 닉네임 (API 응답)
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
  regionIds?: number[]; // 지역은 여러 개 선택 가능
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string[]; // 정렬 기준 및 순서 배열 (예: ["createdAt,ASC", "id,DESC"])
}

/**
 * 게시글 이미지 (PostImg)
 */
export interface PostImg extends BaseEntity {
  isPrimary: boolean; // 대표이미지 여부
  url?: string; // 이미지 URL (일부 API 응답)
  file?: string; // 이미지 파일 URL (일부 API 응답, file 속성 사용)
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
  PENDING_APPROVAL = "PENDING_APPROVAL", // 승인 대기
  PENDING_PAYMENT = "PENDING_PAYMENT", // 결제 대기
  PENDING_PICKUP = "PENDING_PICKUP", // 수령 대기
  SHIPPING = "SHIPPING", // 배송 중
  INSPECTING_RENTAL = "INSPECTING_RENTAL", // 대여 검수
  RENTING = "RENTING", // 대여 중
  PENDING_RETURN = "PENDING_RETURN", // 반납 대기
  RETURNING = "RETURNING", // 반납 중
  RETURN_COMPLETED = "RETURN_COMPLETED", // 반납 완료
  INSPECTING_RETURN = "INSPECTING_RETURN", // 반납 검수
  PENDING_REFUND = "PENDING_REFUND", // 환급 예정
  REFUND_COMPLETED = "REFUND_COMPLETED", // 환급 완료
  LOST_OR_UNRETURNED = "LOST_OR_UNRETURNED", // 미반납/분실
  CLAIMING = "CLAIMING", // 청구 진행
  CLAIM_COMPLETED = "CLAIM_COMPLETED", // 청구 완료
  REJECTED = "REJECTED", // 승인 거절
  CANCELLED = "CANCELLED", // 예약 취소
}

/**
 * 예약 (Reservation)
 */
export interface Reservation extends BaseEntity {
  status: ReservationStatus | string; // PENDING_APPROVAL 등 추가 상태 지원
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
  claimReason: string | null; // 청구 사유
  reservationStartAt: Date | string | null; // 대여시작일 (API 응답은 문자열)
  reservationEndAt: Date | string | null; // 대여종료일 (API 응답은 문자열)
  postId: number;
  authorId: number;
  totalAmount?: number; // 총 금액 (API 응답)
  // 관계 데이터
  post?: Post;
  author?: MemberResponse;
  options?: ReservationOption[];
  option?: unknown[]; // API 응답 형식 (option 배열)
  logs?: unknown[]; // 예약 로그
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
  returnMethod: ReceiveMethod;
  reservationStartAt: string; // YYYY-MM-DD 형식
  reservationEndAt: string; // YYYY-MM-DD 형식
  optionIds?: number[]; // 선택한 옵션 ID 배열 (최대 5개)
}

/**
 * 예약 수정 DTO (상태 변경 등)
 */
export interface UpdateReservationDto {
  // 백엔드 ReservationStatus enum이 확장될 수 있어 string 허용
  status?: ReservationStatus | string;
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
  claimReason?: string;
  reservationStartAt?: string; // LocalDateTime 형식 (YYYY-MM-DDTHH:mm:ss)
  reservationEndAt?: string; // LocalDateTime 형식 (YYYY-MM-DDTHH:mm:ss)
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
  member?: MemberResponse; // 작성자 (예약자) - 기존 필드 (호환용)
  author?: MemberResponse; // 작성자 (백엔드 신규 응답 필드)
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

/**
 * 채팅방 목록용 DTO (백엔드 ChatRoomListDto)
 * - 채팅방 목록 조회 시에만 사용 (기존 코드와 호환)
 */
export interface ChatRoomListDto {
  id: number;
  createdAt: Date;
  post: ChatPostDto;
  otherMember: OtherMemberDto;
  lastMessage?: string | null;
  lastMessageTime?: Date | null;
  unreadCount?: number;
}

/**
 * 채팅 메시지 (ChatMessage) - 기존 코드와 호환
 */
export interface ChatMessageDto {
  id: number;
  authorId: number;
  content: string;
  createdAt: Date;
} /**
 * 채팅 메시지 전송 DTO
 */
export interface SendChatMessageDto {
  chatRoomId: number;
  content: string;
}

/**
 * 채팅방 생성 응답 DTO
 */
export interface CreateChatRoomResBody {
  id: number;
  postId: number;
  teacherId: number;
  studentId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 새로운 채팅방 알림 (기존 코드와 호환)
 */
export interface NewRoomNotiDto {
  id: number;
  createdAt: Date;
  post: ChatPostDto;
  otherMember: OtherMemberDto;
  lastMessage: string | null;
  lastMessageTime: Date | null;
  unreadCount: number;
}

/**
 * 새로운 메시지 알림 (기존 코드와 호환)
 */
export interface NewMessageNotiDto {
  chatRoomId: number;
  messageId: number;
  authorId: number;
  content: string;
  createdAt: Date;
}

/**
 * 채팅 알림 DTO (웹소켓 메시지)
 */
export interface ChatNotiDto {
  type: "NEW_ROOM" | "NEW_MESSAGE";
  payload: NewRoomNotiDto | NewMessageNotiDto;
}

/**
 * 게시글 정보 (채팅용)
 */
export interface ChatPostDto {
  title: string;
}

/**
 * 다른 사용자 정보 (채팅용)
 */
export interface OtherMemberDto {
  id: number;
  nickname: string;
  profileImgUrl: string | null;
}

/**
 * 채팅방 (ChatRoom)
 */
export interface ChatRoomDto {
  id: number;
  createdAt: Date;
  post: ChatPostDto;
  otherMember: OtherMemberDto;
}

/**
 * 채팅방 생성 요청 DTO
 */
export interface CreateChatRoomReqBody {
  postId: number;
}

/**
 * 채팅방 생성 응답 DTO
 */
export interface CreateChatRoomResBody {
  message: string;
  chatRoomId: number;
}
