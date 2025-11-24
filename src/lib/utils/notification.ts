/**
 * 알림 메시지 포맷팅 유틸리티
 */
import type {
  NotificationResBody,
  NotificationType,
  ReservationNotificationData,
} from "@/types/domain";

/**
 * 예약 알림 데이터 타입 가드
 */
function isReservationNotificationData(
  data: unknown,
): data is ReservationNotificationData {
  return (
    data !== null &&
    typeof data === "object" &&
    "postInfo" in data &&
    "reservationInfo" in data
  );
}

/**
 * 예약 알림 타입별 메시지 포맷팅
 */
function formatReservationNotificationMessage(
  notificationType: NotificationType,
  data: ReservationNotificationData,
): string {
  const postTitle = data.postInfo?.title || "게시글";
  const authorNickname = data.reservationInfo?.author?.nickname || "사용자";
  const rejectReason = data.reservationInfo?.rejectReason;
  const cancelReason = data.reservationInfo?.cancelReason;

  switch (notificationType) {
    case "RESERVATION_PENDING_APPROVAL":
      return `${authorNickname}님이 "${postTitle}" 게시글에 예약을 요청했습니다.`;

    case "RESERVATION_PENDING_PAYMENT":
      return `"${postTitle}" 게시글의 예약이 결제 대기 중입니다.`;

    case "RESERVATION_PENDING_PICKUP":
      return `"${postTitle}" 게시글의 예약이 수령 대기 중입니다.`;

    case "RESERVATION_SHIPPING":
      return `"${postTitle}" 게시글의 예약 상품이 배송 중입니다.`;

    case "RESERVATION_INSPECTING_RENTAL":
      return `"${postTitle}" 게시글의 예약 상품 대여 검수가 진행 중입니다.`;

    case "RESERVATION_RENTING":
      return `"${postTitle}" 게시글의 예약 상품이 대여 중입니다.`;

    case "RESERVATION_PENDING_RETURN":
      return `"${postTitle}" 게시글의 예약 상품 반납이 대기 중입니다.`;

    case "RESERVATION_RETURNING":
      return `"${postTitle}" 게시글의 예약 상품이 반납 배송 중입니다.`;

    case "RESERVATION_RETURN_COMPLETED":
      return `"${postTitle}" 게시글의 예약 상품 반납이 완료되었습니다.`;

    case "RESERVATION_INSPECTING_RETURN":
      return `"${postTitle}" 게시글의 예약 상품 반납 검수가 진행 중입니다.`;

    case "RESERVATION_PENDING_REFUND":
      return `"${postTitle}" 게시글의 예약 환급이 예정되어 있습니다.`;

    case "RESERVATION_REFUND_COMPLETED":
      return `"${postTitle}" 게시글의 예약 환급이 완료되었습니다.`;

    case "RESERVATION_LOST_OR_UNRETURNED":
      return `"${postTitle}" 게시글의 예약 상품이 미반납 또는 분실 처리되었습니다.`;

    case "RESERVATION_CLAIMING":
      return `"${postTitle}" 게시글의 예약 청구가 진행 중입니다.`;

    case "RESERVATION_CLAIM_COMPLETED":
      return `"${postTitle}" 게시글의 예약 청구가 완료되었습니다.`;

    case "RESERVATION_REJECTED":
      return rejectReason
        ? `"${postTitle}" 게시글의 예약이 거절되었습니다. (사유: ${rejectReason})`
        : `"${postTitle}" 게시글의 예약이 거절되었습니다.`;

    case "RESERVATION_CANCELLED":
      return cancelReason
        ? `"${postTitle}" 게시글의 예약이 취소되었습니다. (사유: ${cancelReason})`
        : `"${postTitle}" 게시글의 예약이 취소되었습니다.`;

    default:
      return `"${postTitle}" 게시글과 관련된 알림입니다.`;
  }
}

/**
 * 알림 메시지 포맷팅 함수
 * @param notification 알림 데이터
 * @returns 포맷팅된 알림 메시지
 */
export function formatNotificationMessage(
  notification: NotificationResBody,
): string {
  const { notificationType, data } = notification;

  // 예약 알림 타입인 경우
  if (isReservationNotificationData(data)) {
    return formatReservationNotificationMessage(notificationType, data);
  }

  // 기타 알림 타입 (추후 확장 가능)
  // 현재는 예약 알림만 지원
  return "알림 내용이 없습니다.";
}
