"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, MapPin, User, Truck, CheckCircle } from "lucide-react";

import type { CreateReservationDto } from "@/types/domain";
import { ReceiveMethod } from "@/types/domain";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarRangePicker } from "@/components/ui/calendar-range-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

import { usePostQuery } from "@/queries/post";
import {
  useCreateReservationMutation,
  useReservationQuery,
  useUpdateReservationMutation,
} from "@/queries/reservation";

/**
 * 예약 생성 페이지 (내부 컴포넌트)
 */
function NewReservationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = Number(searchParams.get("postId"));
  const reservationIdParam = searchParams.get("reservationId");
  const reservationId = reservationIdParam ? Number(reservationIdParam) : null;
  const { isAuthenticated } = useAuthStore();
  const showToast = useUIStore((state) => state.showToast);

  const { data: post, isLoading: postLoading } = usePostQuery(postId);
  const createReservationMutation = useCreateReservationMutation();
  const updateReservationMutation = useUpdateReservationMutation();
  const { data: existingReservation } = useReservationQuery(
    reservationId ?? 0,
  );

  const [formData, setFormData] = useState<Partial<CreateReservationDto>>({
    postId: postId || 0,
    receiveMethod: ReceiveMethod.DIRECT,
    returnMethod: ReceiveMethod.DIRECT,
    reservationStartAt: "",
    reservationEndAt: "",
    optionIds: [],
  });

  const [receiveAddress1, setReceiveAddress1] = useState("");
  const [receiveAddress2, setReceiveAddress2] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isOptionPickerOpen, setIsOptionPickerOpen] = useState(false);

  // 게시글 정보가 로드되면 기본값 설정 (새 예약일 때만)
  useEffect(() => {
    if (reservationId || !post) return;
    // 게시글의 수령/반납 방법에 따라 기본값 설정
    // ANY인 경우 DIRECT를 기본값으로 설정
    if (post.receiveMethod) {
      const defaultReceiveMethod =
        post.receiveMethod === ReceiveMethod.ANY
          ? ReceiveMethod.DIRECT
          : (post.receiveMethod as ReceiveMethod);
      setFormData((prev) => ({
        ...prev,
        receiveMethod: defaultReceiveMethod,
      }));
    }
    if (post.returnMethod) {
      const defaultReturnMethod =
        post.returnMethod === ReceiveMethod.ANY
          ? ReceiveMethod.DIRECT
          : (post.returnMethod as ReceiveMethod);
      setFormData((prev) => ({
        ...prev,
        returnMethod: defaultReturnMethod,
      }));
    }
  }, [post, reservationId]);

  // 기존 예약이 있을 경우(수정 모드) 기본값을 예약 값으로 설정
  useEffect(() => {
    if (!existingReservation || !reservationId) return;

    // 승인 대기 상태가 아니면 수정 불가
    if (existingReservation.status !== "PENDING_APPROVAL") {
      showToast("승인 대기 상태의 예약만 수정할 수 있습니다.", "error");
      router.push(`/reservations/${existingReservation.id}`);
      return;
    }

    const start =
      existingReservation.reservationStartAt &&
      new Date(
        typeof existingReservation.reservationStartAt === "string"
          ? existingReservation.reservationStartAt
          : existingReservation.reservationStartAt,
      );
    const end =
      existingReservation.reservationEndAt &&
      new Date(
        typeof existingReservation.reservationEndAt === "string"
          ? existingReservation.reservationEndAt
          : existingReservation.reservationEndAt,
      );

    setStartDate(start || null);
    setEndDate(end || null);

    setFormData((prev) => ({
      ...prev,
      postId: existingReservation.postId,
      receiveMethod:
        (existingReservation.receiveMethod as ReceiveMethod) ??
        ReceiveMethod.DIRECT,
      returnMethod:
        (existingReservation.returnMethod as ReceiveMethod) ??
        ReceiveMethod.DIRECT,
      reservationStartAt: start
        ? start.toISOString().split("T")[0]
        : prev.reservationStartAt,
      reservationEndAt: end
        ? end.toISOString().split("T")[0]
        : prev.reservationEndAt,
      optionIds:
        existingReservation.options?.map((o) => o.optionId) ??
        prev.optionIds ??
        [],
    }));

    if (existingReservation.receiveMethod === ReceiveMethod.DELIVERY) {
      setReceiveAddress1(existingReservation.receiveAddress1 || "");
      setReceiveAddress2(existingReservation.receiveAddress2 || "");
    }
  }, [existingReservation, reservationId, router, showToast]);

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // postId가 없으면 게시글 목록으로 리다이렉트 (단, 수정 모드에서는 existingReservation 기준)
  useEffect(() => {
    if (reservationId) return;
    if (!postId || postId === 0) {
      router.push("/posts");
    }
  }, [postId, reservationId, router]);

  // 다음 주소 검색 스크립트 로드
  useEffect(() => {
    if (window.daum && window.daum.Postcode) {
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      try {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      } catch {
        // 스크립트가 이미 제거되었을 수 있음
      }
    };
  }, []);

  // 주소 검색 팝업 열기
  const handleOpenAddressSearch = () => {
    if (typeof window === "undefined" || !window.daum) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: daum.PostcodeData) {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
          if (data.bname !== "") {
            extraAddress += data.bname;
          }
          if (data.buildingName !== "") {
            extraAddress +=
              extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
          }
          fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }

        setReceiveAddress1(fullAddress);
      },
      width: "100%",
      height: "100%",
    }).open({
      q: receiveAddress1,
      left: window.screen.width / 2 - 300,
      top: window.screen.height / 2 - 300,
    });
  };

  // 수령 방법 변경
  const handleReceiveMethodChange = (method: ReceiveMethod) => {
    setFormData({ ...formData, receiveMethod: method });
    // 택배가 아니면 주소 초기화
    if (method !== ReceiveMethod.DELIVERY && method !== ReceiveMethod.ANY) {
      setReceiveAddress1("");
      setReceiveAddress2("");
    }
  };

  // 반납 방법 변경
  const handleReturnMethodChange = (method: ReceiveMethod) => {
    setFormData({ ...formData, returnMethod: method });
  };

  // 옵션 선택/해제
  const handleOptionToggle = (optionId: number) => {
    const currentOptionIds = formData.optionIds || [];
    if (currentOptionIds.includes(optionId)) {
      // 이미 선택된 옵션이면 제거
      setFormData({
        ...formData,
        optionIds: currentOptionIds.filter((id) => id !== optionId),
      });
    } else {
      // 최대 5개까지만 선택 가능
      if (currentOptionIds.length >= 5) {
        showToast("옵션은 최대 5개까지 선택할 수 있습니다.", "error");
        return;
      }
      setFormData({
        ...formData,
        optionIds: [...currentOptionIds, optionId],
      });
    }
  };

  // 게시글의 수령/반납 방법에 따라 선택 가능한 옵션 필터링
  // 예약 신청 시에는 "상관없음" 옵션 제외
  const getAvailableReceiveMethods = (): ReceiveMethod[] => {
    if (!post) return [];
    const methods: ReceiveMethod[] = [];
    if (post.receiveMethod === "DIRECT" || post.receiveMethod === "ANY") {
      methods.push(ReceiveMethod.DIRECT);
    }
    if (post.receiveMethod === "DELIVERY" || post.receiveMethod === "ANY") {
      methods.push(ReceiveMethod.DELIVERY);
    }
    // 예약 신청 시에는 ANY 옵션 제외
    return methods;
  };

  const getAvailableReturnMethods = (): ReceiveMethod[] => {
    if (!post) return [];
    const methods: ReceiveMethod[] = [];
    if (post.returnMethod === "DIRECT" || post.returnMethod === "ANY") {
      methods.push(ReceiveMethod.DIRECT);
    }
    if (post.returnMethod === "DELIVERY" || post.returnMethod === "ANY") {
      methods.push(ReceiveMethod.DELIVERY);
    }
    // 예약 신청 시에는 ANY 옵션 제외
    return methods;
  };

  const RECEIVE_METHOD_LABELS: Record<ReceiveMethod, string> = {
    DIRECT: "만나서",
    DELIVERY: "택배",
    ANY: "상관없음",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 필드 검증
    if (!startDate || !endDate) {
      showToast("일정을 선택해주세요.", "error");
      return;
    }

    if (!formData.receiveMethod || !formData.returnMethod) {
      showToast("수령/반납 방법을 선택해주세요.", "error");
      return;
    }

    // 날짜 검증
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      showToast("시작일은 오늘 이후여야 합니다.", "error");
      return;
    }

    if (endDate <= startDate) {
      showToast("종료일은 시작일보다 이후여야 합니다.", "error");
      return;
    }

    // 날짜를 YYYY-MM-DD 형식으로 변환
    const reservationStartAt = startDate.toISOString().split("T")[0];
    const reservationEndAt = endDate.toISOString().split("T")[0];

    // 택배일 경우 주소 필수
    if (
      formData.receiveMethod === ReceiveMethod.DELIVERY &&
      !receiveAddress1
    ) {
      showToast("수령 주소를 입력해주세요.", "error");
      return;
    }

    // 옵션 ID 검증 (최대 5개)
    if (formData.optionIds && formData.optionIds.length > 5) {
      showToast("옵션은 최대 5개까지 선택할 수 있습니다.", "error");
      return;
    }

    const submitData: CreateReservationDto = {
      postId: formData.postId!,
      receiveMethod: formData.receiveMethod!,
      returnMethod: formData.returnMethod!,
      reservationStartAt,
      reservationEndAt,
      optionIds:
        formData.optionIds && formData.optionIds.length > 0
          ? formData.optionIds
          : undefined,
    };

    // 주소 추가 (수령 주소만)
    if (formData.receiveMethod === ReceiveMethod.DELIVERY) {
      submitData.receiveAddress1 = receiveAddress1;
      submitData.receiveAddress2 = receiveAddress2;
    }

    try {
      if (reservationId) {
        // 수정 모드: 업데이트 요청
        await updateReservationMutation.mutateAsync({
          reservationId,
          data: {
            receiveMethod: submitData.receiveMethod,
            returnMethod: submitData.returnMethod,
            reservationStartAt: startDate,
            reservationEndAt: endDate,
            optionIds: submitData.optionIds,
            receiveAddress1: submitData.receiveAddress1,
            receiveAddress2: submitData.receiveAddress2,
          },
        });
        showToast("예약이 수정되었습니다.", "success");
        router.push(`/reservations/${reservationId}`);
      } else {
        // 생성 모드
        const response =
          await createReservationMutation.mutateAsync(submitData);
        router.push(`/reservations/${response.id}`);
      }
    } catch (error) {
      console.error(reservationId ? "Failed to update reservation:" : "Failed to create reservation:", error);
    }
  };

  if (postLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-64 bg-gray-200 rounded mb-4" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">게시글을 찾을 수 없습니다.</p>
        <Button onClick={() => router.push("/posts")} className="mt-4">
          게시글 목록으로
        </Button>
      </div>
    );
  }

  const availableReceiveMethods = getAvailableReceiveMethods();
  const availableReturnMethods = getAvailableReturnMethods();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {reservationId ? "예약 수정" : "대여 신청"}
          </CardTitle>
          <CardDescription>{post.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 일정 선택 */}
            <div
              className={`el-input-box el-input-schedule-box ${
                isDatePickerOpen ? "on" : ""
              }`}
            >
              <div className="input-box">
                <span className="txt">일정</span>
                <input
                  type="text"
                  name="schedule"
                  data-value=""
                  className="input-text"
                  placeholder="일정을 선택해주세요."
                  readOnly
                  value={
                    startDate && endDate
                      ? `${startDate.toLocaleDateString("ko-KR")} ~ ${endDate.toLocaleDateString("ko-KR")}`
                      : startDate
                        ? `${startDate.toLocaleDateString("ko-KR")} ~ `
                        : ""
                  }
                  onClick={() => {
                    setIsDatePickerOpen(!isDatePickerOpen);
                    // 달력을 열 때 옵션 드롭다운이 열려있으면 닫기
                    if (!isDatePickerOpen && isOptionPickerOpen) {
                      setIsOptionPickerOpen(false);
                    }
                  }}
                  disabled={createReservationMutation.isPending}
                  required
                />
              </div>
              {isDatePickerOpen && (
                <div className="search-option-area calendar-option-area">
                  <CalendarRangePicker
                    selectedStartDate={startDate}
                    selectedEndDate={endDate}
                    minDate={new Date()}
                    monthsShown={4}
                    onChange={(start, end) => {
                      setStartDate(start);
                      setEndDate(end);
                      if (start) {
                        setFormData({
                          ...formData,
                          reservationStartAt: start
                            .toISOString()
                            .split("T")[0],
                        });
                      }
                      if (end) {
                        setFormData({
                          ...formData,
                          reservationEndAt: end.toISOString().split("T")[0],
                        });
                        // 종료일이 선택되면 자동으로 달력 닫기
                        setIsDatePickerOpen(false);
                      }
                    }}
                    disabled={createReservationMutation.isPending}
                  />
                </div>
              )}
            </div>

            {/* 옵션 선택 */}
            {post.options && post.options.length > 0 && (
              <Popover
                open={isOptionPickerOpen}
                onOpenChange={setIsOptionPickerOpen}
              >
                <PopoverTrigger asChild>
                  <div
                    className={`el-input-box el-input-option-box ${
                      isOptionPickerOpen ? "on" : ""
                    }`}
                  >
                    <div className="input-box">
                      <span className="txt">옵션</span>
                      <input
                        type="text"
                        name="option"
                        className="input-text"
                        placeholder="옵션을 선택해주세요."
                        readOnly
                        value={
                          formData.optionIds && formData.optionIds.length > 0
                            ? `${formData.optionIds.length}개 옵션 선택됨`
                            : ""
                        }
                        disabled={createReservationMutation.isPending}
                      />
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0 min-w-[280px]"
                  align="start"
                  sideOffset={4}
                  style={{ zIndex: 30 }}
                >
                  <div className="search-option-area">
                    <div className="option-list-area scroll-y-area">
                      <div className="checkbox-list">
                        {post.options.map((option, index) => {
                          const optionId = option.id || index;
                          const isSelected =
                            formData.optionIds?.includes(optionId) || false;
                          return (
                            <div
                              key={index}
                              className="input-box input-box-checkbox"
                            >
                              <Checkbox
                                id={`option_check_${index}`}
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handleOptionToggle(optionId)
                                }
                                disabled={createReservationMutation.isPending}
                                className="mt-0.5 h-5 w-5"
                              />
                              <label
                                className="body3 txt-color3 flex-1 cursor-pointer flex items-start gap-3"
                                htmlFor={`option_check_${index}`}
                              >
                                <div className="txt-area flex-1 flex flex-col gap-1">
                                  <p className="body2 txt-bold option-title text-sm font-semibold text-gray-900 m-0">
                                    {option.name}
                                  </p>
                                  <span className="caption2 txt-color3 text-xs text-gray-600">
                                    {option.fee > 0
                                      ? `${option.fee.toLocaleString()}원`
                                      : option.deposit > 0
                                        ? `${option.deposit.toLocaleString()}원`
                                        : "무료"}
                                  </span>
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="option-btn-area flex justify-end p-4 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOptionPickerOpen(false)}
                        disabled={createReservationMutation.isPending}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        적용
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* 수령 방법 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                수령 방식 <span className="text-red-500">*</span>
              </label>
              <RadioGroup
                value={formData.receiveMethod}
                onValueChange={(value) =>
                  handleReceiveMethodChange(value as ReceiveMethod)
                }
                disabled={createReservationMutation.isPending}
                className="space-y-2"
              >
                {availableReceiveMethods.map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${
                      formData.receiveMethod === method
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <RadioGroupItem
                      value={method}
                      id={`receive-${method}`}
                      className="h-4 w-4"
                    />
                    {method === ReceiveMethod.DIRECT && (
                      <User className="h-5 w-5 text-gray-600" />
                    )}
                    {method === ReceiveMethod.DELIVERY && (
                      <Truck className="h-5 w-5 text-gray-600" />
                    )}
                    {method === ReceiveMethod.ANY && (
                      <CheckCircle className="h-5 w-5 text-gray-600" />
                    )}
                    <span className="flex-1">
                      {RECEIVE_METHOD_LABELS[method]}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* 수령 주소 (택배일 경우) */}
            {formData.receiveMethod === ReceiveMethod.DELIVERY && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  수령 주소 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="도로명 주소를 검색해주세요"
                    value={receiveAddress1}
                    onChange={(e) => setReceiveAddress1(e.target.value)}
                    disabled={createReservationMutation.isPending}
                    required
                    className="flex-1"
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleOpenAddressSearch}
                    disabled={createReservationMutation.isPending}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <MapPin className="h-4 w-4" />
                    주소 검색
                  </Button>
                </div>
                <Input
                  type="text"
                  placeholder="상세 주소 (예: 123-45, 101호)"
                  value={receiveAddress2}
                  onChange={(e) => setReceiveAddress2(e.target.value)}
                  disabled={createReservationMutation.isPending}
                  className="w-full"
                />
              </div>
            )}

            {/* 반납 방법 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                반납 방식 <span className="text-red-500">*</span>
              </label>
              <RadioGroup
                value={formData.returnMethod}
                onValueChange={(value) =>
                  handleReturnMethodChange(value as ReceiveMethod)
                }
                disabled={createReservationMutation.isPending}
                className="space-y-2"
              >
                {availableReturnMethods.map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${
                      formData.returnMethod === method
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <RadioGroupItem
                      value={method}
                      id={`return-${method}`}
                      className="h-4 w-4"
                    />
                    {method === ReceiveMethod.DIRECT && (
                      <User className="h-5 w-5 text-gray-600" />
                    )}
                    {method === ReceiveMethod.DELIVERY && (
                      <Truck className="h-5 w-5 text-gray-600" />
                    )}
                    {method === ReceiveMethod.ANY && (
                      <CheckCircle className="h-5 w-5 text-gray-600" />
                    )}
                    <span className="flex-1">
                      {RECEIVE_METHOD_LABELS[method]}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {createReservationMutation.isError && (
              <p className="text-sm text-red-600">
                예약 신청에 실패했습니다. 다시 시도해주세요.
              </p>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createReservationMutation.isPending}
                className="flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createReservationMutation.isPending || updateReservationMutation.isPending}
              >
                {reservationId
                  ? updateReservationMutation.isPending
                    ? "수정 중..."
                    : "수정하기"
                  : createReservationMutation.isPending
                    ? "예약 중..."
                    : "예약하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 예약 생성 페이지 (Suspense 래퍼)
 */
export default function NewReservationPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-64 bg-gray-200 rounded mb-4" />
          </div>
        </div>
      }
    >
      <NewReservationPageContent />
    </Suspense>
  );
}

