/**
 * 마이페이지 - 내 게시글
 */
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  User,
  Truck,
  CheckCircle,
  X,
} from "lucide-react";

import type { Post, Reservation } from "@/types/domain";
import { ReceiveMethod } from "@/types/domain";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { getImageUrl } from "@/lib/utils/image";

import { useMyPostsQuery } from "@/queries/post";
import {
  useReservationsByPostQuery,
  useApproveReservationMutation,
  useRejectReservationMutation,
} from "@/queries/reservation";
import { useUIStore } from "@/store/uiStore";

const statusLabels: Record<string, string> = {
  PENDING: "승인 대기",
  PENDING_APPROVAL: "승인 대기",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
  COMPLETED: "대여 완료",
  CANCELLED: "취소됨",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const RECEIVE_METHOD_LABELS: Record<ReceiveMethod, string> = {
  DIRECT: "만나서",
  DELIVERY: "택배",
  ANY: "상관없음",
};

/**
 * 게시글 카드 컴포넌트 (예약 목록 포함)
 */
function PostCard({ post }: { post: Post }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showToast = useUIStore((state) => state.showToast);
  const approveMutation = useApproveReservationMutation();
  const rejectMutation = useRejectReservationMutation();

  const {
    data: reservationsData,
    isLoading: reservationsLoading,
  } = useReservationsByPostQuery(post.id, {
    enabled: isExpanded, // 펼쳐졌을 때만 조회
  });

  const reservations = useMemo(() => {
    if (!reservationsData) return [];
    return Array.isArray(reservationsData)
      ? reservationsData
      : reservationsData.content || [];
  }, [reservationsData]);

  const handleApprove = async (reservationId: number) => {
    try {
      await approveMutation.mutateAsync(reservationId);
      showToast("예약이 승인되었습니다.", "success");
    } catch (error) {
      console.error("Failed to approve reservation:", error);
    }
  };

  const handleReject = async (reservationId: number) => {
    const reason = prompt("거절 사유를 입력해주세요:");
    if (!reason || !reason.trim()) {
      showToast("거절 사유를 입력해주세요.", "error");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        reservationId,
        reason,
      });
      showToast("예약이 거절되었습니다.", "success");
    } catch (error) {
      console.error("Failed to reject reservation:", error);
    }
  };


  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* 게시글 정보 */}
        <div className="flex gap-4 mb-4">
          {/* 이미지 */}
          <div className="flex-shrink-0">
            <Image
              src={getImageUrl(
                post.thumbnailImageUrl ||
                post.images?.[0]?.file ||
                post.images?.[0]?.url,
              )}
              alt={post.title}
              width={120}
              height={120}
              className="rounded-lg object-cover w-[120px] h-[120px]"
            />
          </div>

          {/* 정보 */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {post.title}
                </h3>
                {post.regions && post.regions.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {post.regions
                        .map((r) => r.name)
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                <p className="text-sm text-gray-600 mb-2">
                  {post.createdAt &&
                    format(new Date(post.createdAt), "yyyy-MM-dd", {
                      locale: ko,
                    })}
                </p>
                <p className="text-lg font-semibold text-blue-600">
                  {post.fee?.toLocaleString() || 0}원/일
                </p>
              </div>

              {/* 예약 건수 */}
              {isExpanded && reservations.length > 0 && (
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    예약 {reservations.length}건
                  </span>
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex items-center gap-2 mt-2">
              {/* 펼치기 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    예약 목록 보기
                  </>
                )}
              </Button>

              {/* 상세보기 버튼 */}
              <Link href={`/posts/${post.id}`}>
                <Button variant="outline" size="sm">
                  상세보기
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 예약 목록 (펼쳐졌을 때만 표시) */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {reservationsLoading ? (
              <div className="text-center py-8 text-gray-500">
                예약 목록을 불러오는 중...
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                예약이 없습니다.
              </div>
            ) : (
              <>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  예약 목록 (총 {reservations.length}건의 예약)
                </h4>
                <div className="space-y-4">
                  {reservations.map((reservation: Reservation) => {
                    const reservationStartDate =
                      reservation.reservationStartAt &&
                      new Date(
                        typeof reservation.reservationStartAt === "string"
                          ? reservation.reservationStartAt
                          : reservation.reservationStartAt,
                      );
                    const reservationEndDate =
                      reservation.reservationEndAt &&
                      new Date(
                        typeof reservation.reservationEndAt === "string"
                          ? reservation.reservationEndAt
                          : reservation.reservationEndAt,
                      );
                    const reservationDays =
                      reservationStartDate && reservationEndDate
                        ? Math.ceil(
                            (reservationEndDate.getTime() -
                              reservationStartDate.getTime()) /
                              (1000 * 60 * 60 * 24),
                          ) + 1
                        : 0;

                    // 옵션 목록
                    const options =
                      reservation.options?.map((ro) => ({
                        id: ro.id,
                        name: ro.option?.name || `옵션 #${ro.optionId}`,
                        fee: ro.option?.fee || 0,
                        deposit: ro.option?.deposit || 0,
                      })) ||
                      (reservation.option?.map((opt: unknown, index: number) => {
                        if (
                          opt &&
                          typeof opt === "object" &&
                          ("name" in opt || "id" in opt)
                        ) {
                          return {
                            id: ("id" in opt && opt.id) || index,
                            name: ("name" in opt && opt.name) || `옵션 #${index}`,
                            fee: ("fee" in opt && opt.fee) || 0,
                            deposit: ("deposit" in opt && opt.deposit) || 0,
                          };
                        }
                        return null;
                      }).filter(Boolean) as Array<{
                        id: number;
                        name: string;
                        fee: number;
                        deposit: number;
                      }>) ||
                      [];

                    // 결제 금액 계산
                    const baseFee = post.fee || 0;
                    const baseDeposit = post.deposit || 0;
                    const rentalFee = baseFee * reservationDays;
                    const optionsFee = options.reduce(
                      (sum, opt) => sum + (opt.fee || 0) * reservationDays,
                      0,
                    );
                    const optionsDeposit = options.reduce(
                      (sum, opt) => sum + (opt.deposit || 0),
                      0,
                    );
                    const totalRentalFee = rentalFee + optionsFee;
                    const totalDeposit = baseDeposit + optionsDeposit;
                    const totalAmount = totalRentalFee + totalDeposit;

                    const status = reservation.status as string;

                    return (
                      <Card key={reservation.id} className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            {/* 예약자 정보 */}
                            <div className="flex items-center gap-3">
                              {reservation.author?.profileImgUrl ? (
                                <Image
                                  src={getImageUrl(
                                    reservation.author.profileImgUrl,
                                  )}
                                  alt={reservation.author.nickname || "예약자"}
                                  width={48}
                                  height={48}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {reservation.author?.nickname || "예약자"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  신청일:{" "}
                                  {reservation.createdAt &&
                                    format(
                                      new Date(reservation.createdAt),
                                      "yyyy-MM-dd",
                                      { locale: ko },
                                    )}
                                </p>
                              </div>
                            </div>

                            {/* 상태 */}
                            <span
                              className={`rounded-full px-3 py-1 text-sm font-medium ${
                                statusColors[status] ||
                                "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {statusLabels[status] || status}
                            </span>
                          </div>

                          {/* 선택한 장비 */}
                          {options.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                선택한 장비
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {options.map((option) => (
                                  <div
                                    key={option.id}
                                    className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-gray-200"
                                  >
                                    <span className="text-sm text-gray-900">
                                      {option.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 대여 기간 */}
                          {reservationStartDate && reservationEndDate && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                대여 기간
                              </p>
                              <p className="text-sm text-gray-900">
                                {format(reservationStartDate, "yyyy-MM-dd", {
                                  locale: ko,
                                })}{" "}
                                -{" "}
                                {format(reservationEndDate, "yyyy-MM-dd", {
                                  locale: ko,
                                })}{" "}
                                ({reservationDays}일)
                              </p>
                            </div>
                          )}

                          {/* 총 결제금액 */}
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              총 결제금액
                            </p>
                            <p className="text-lg font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-block">
                              {totalAmount.toLocaleString()}원
                            </p>
                          </div>

                          {/* 수령/반납 방식 */}
                          <div className="mb-4 flex items-center gap-4 text-sm text-gray-700">
                            {reservation.receiveMethod && (
                              <div className="flex items-center gap-1">
                                <span>수령:</span>
                                {reservation.receiveMethod ===
                                ReceiveMethod.DIRECT ? (
                                  <User className="h-4 w-4" />
                                ) : (
                                  <Truck className="h-4 w-4" />
                                )}
                                <span>
                                  {
                                    RECEIVE_METHOD_LABELS[
                                      reservation.receiveMethod
                                    ]
                                  }
                                </span>
                              </div>
                            )}
                            {reservation.returnMethod && (
                              <div className="flex items-center gap-1">
                                <span>반납:</span>
                                {reservation.returnMethod ===
                                ReceiveMethod.DIRECT ? (
                                  <User className="h-4 w-4" />
                                ) : (
                                  <Truck className="h-4 w-4" />
                                )}
                                <span>
                                  {
                                    RECEIVE_METHOD_LABELS[
                                      reservation.returnMethod
                                    ]
                                  }
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                            <Link href={`/reservations/${reservation.id}`}>
                              <Button variant="outline" size="sm">
                                상세보기
                              </Button>
                            </Link>
                            {(status === "PENDING" ||
                              status === "PENDING_APPROVAL") && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(reservation.id)}
                                  disabled={approveMutation.isPending}
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  승인
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReject(reservation.id)}
                                  disabled={rejectMutation.isPending}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  거절
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 마이페이지 - 내 게시글
 */
export default function MyPostsPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string[]>(["createdAt,DESC"]);
  const pageSize = 10;

  const { data: myPostsData, isLoading: postsLoading } = useMyPostsQuery({
    page: page - 1,
    size: pageSize,
    sort,
  });

  const posts = useMemo(() => {
    if (!myPostsData) return [];
    return Array.isArray(myPostsData)
      ? myPostsData
      : myPostsData.content || [];
  }, [myPostsData]);

  const totalPages = useMemo(() => {
    if (!myPostsData || Array.isArray(myPostsData)) return 1;
    return myPostsData.page?.totalPages || 1;
  }, [myPostsData]);

  const totalElements = useMemo(() => {
    if (!myPostsData || Array.isArray(myPostsData)) {
      return Array.isArray(myPostsData) ? myPostsData.length : 0;
    }
    return myPostsData.page?.totalElements || 0;
  }, [myPostsData]);

  const handleSortChange = (sortField: "createdAt" | "deposit" | "fee") => {
    const currentSort = sort || ["createdAt,DESC"];
    const currentOrder = currentSort[0]?.split(",")[1] || "DESC";
    setSort([`${sortField},${currentOrder}`]);
    setPage(1); // 정렬 변경 시 첫 페이지로
  };

  const handleOrderChange = (order: "asc" | "desc") => {
    const currentSort = sort || ["createdAt,DESC"];
    const currentSortField = currentSort[0]?.split(",")[0] || "createdAt";
    const orderUpper = order.toUpperCase();
    setSort([`${currentSortField},${orderUpper}`]);
    setPage(1); // 정렬 변경 시 첫 페이지로
  };

  if (postsLoading) {
    return (
      <div className="p-0">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">내 게시글</h1>
          <Link href="/posts/new">
            <Button>게시글 등록</Button>
          </Link>
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="h-24 w-24 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">내 게시글</h1>
        <Link href="/posts/new">
          <Button>게시글 등록</Button>
        </Link>
      </div>

      {/* 총 게시글 수 및 정렬 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span>총 {totalElements}개의 게시글</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">정렬:</label>
          <select
            value={sort?.[0]?.split(",")[0] || "createdAt"}
            onChange={(e) =>
              handleSortChange(
                e.target.value as "createdAt" | "deposit" | "fee",
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="createdAt">등록일</option>
            <option value="deposit">보증금</option>
            <option value="fee">대여료</option>
          </select>
          <select
            value={sort?.[0]?.split(",")[1]?.toLowerCase() || "desc"}
            onChange={(e) => handleOrderChange(e.target.value as "asc" | "desc")}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </div>
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">게시글이 없습니다.</p>
            <Link href="/posts/new">
              <Button>게시글 작성하기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post: Post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {posts.length > 0 && (
        <div className="mt-8">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
