"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isAfter, isBefore, getDay, addMonths } from "date-fns";
import { ko } from "date-fns/locale";

interface CalendarRangePickerProps {
  selectedStartDate?: Date | null;
  selectedEndDate?: Date | null;
  minDate?: Date;
  monthsShown?: number;
  onChange: (startDate: Date | null, endDate: Date | null) => void;
  disabled?: boolean;
}

/**
 * 커스텀 날짜 범위 선택 달력 컴포넌트
 */
export function CalendarRangePicker({
  selectedStartDate,
  selectedEndDate,
  minDate = new Date(),
  monthsShown = 4,
  onChange,
  disabled = false,
}: CalendarRangePickerProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // 표시할 월들 계산
  const months = useMemo(() => {
    const startMonth = minDate || new Date();
    return Array.from({ length: monthsShown }, (_, i) => {
      return addMonths(startMonth, i);
    });
  }, [minDate, monthsShown]);

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    if (disabled) return;

    // 최소 날짜 이전은 선택 불가
    const minDateAtStartOfDay = new Date(minDate);
    minDateAtStartOfDay.setHours(0, 0, 0, 0);
    const clickedDateAtStartOfDay = new Date(date);
    clickedDateAtStartOfDay.setHours(0, 0, 0, 0);

    if (clickedDateAtStartOfDay < minDateAtStartOfDay) {
      return;
    }

    // 시작일과 종료일 선택 로직
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // 시작일 선택 또는 재선택
      onChange(date, null);
    } else if (selectedStartDate && !selectedEndDate) {
      // 종료일 선택
      if (isBefore(date, selectedStartDate)) {
        // 종료일이 시작일보다 이전이면 시작일을 변경
        onChange(date, null);
      } else {
        // 정상적인 종료일 선택
        onChange(selectedStartDate, date);
      }
    }
  };

  // 날짜의 상태 확인
  const getDateStatus = (date: Date, month: Date) => {
    if (!isSameMonth(date, month)) {
      return "outside";
    }

    const dateAtStartOfDay = new Date(date);
    dateAtStartOfDay.setHours(0, 0, 0, 0);
    const minDateAtStartOfDay = new Date(minDate);
    minDateAtStartOfDay.setHours(0, 0, 0, 0);

    if (dateAtStartOfDay < minDateAtStartOfDay) {
      return "unselectable";
    }

    if (selectedStartDate && isSameDay(date, selectedStartDate)) {
      return "started";
    }

    if (selectedEndDate && isSameDay(date, selectedEndDate)) {
      return "ended";
    }

    if (selectedStartDate && selectedEndDate) {
      if (isAfter(date, selectedStartDate) && isBefore(date, selectedEndDate)) {
        return "scheduled";
      }
    }

    // 호버 상태 (시작일이 선택되고 종료일이 없을 때)
    if (selectedStartDate && !selectedEndDate && hoveredDate) {
      if (isAfter(date, selectedStartDate) && isBefore(date, hoveredDate) || isSameDay(date, hoveredDate)) {
        return "scheduled";
      }
    }

    return "normal";
  };

  // 특정 월의 달력 그리드 생성
  const getCalendarDays = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 일요일부터 시작
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const handleApply = () => {
    // 적용 버튼 클릭 시에는 특별한 동작 없음 (날짜 선택으로 자동 적용)
    // 필요시 추가 로직 구현 가능
  };

  return (
    <div className="option-list-area calendar-area">
      {/* 고정 요일 헤더 */}
      <div className="calendar-weekdays">
        <span className="weekday weekday-sun">일</span>
        <span className="weekday">월</span>
        <span className="weekday">화</span>
        <span className="weekday">수</span>
        <span className="weekday">목</span>
        <span className="weekday">금</span>
        <span className="weekday weekday-sat">토</span>
      </div>
      <div className="calendar-wrap">
        <table className="calendar-table-area calendar-scroll">
          <caption className="blind">달력 테이블</caption>
            <thead className="calendar-header sr-only">
              <tr>
                <th>일</th>
                <th>월</th>
                <th>화</th>
                <th>수</th>
                <th>목</th>
                <th>금</th>
                <th>토</th>
              </tr>
            </thead>
            <tbody className="calendar-body">
              {months.flatMap((month, monthIndex) => {
                const days = getCalendarDays(month);
                const weeks = Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => {
                  return days.slice(weekIndex * 7, (weekIndex + 1) * 7);
                });

                return [
                  <tr key={`month-header-${monthIndex}`}>
                    <td className="calendar-month" colSpan={7}>
                      {format(month, "yyyy년 MM월", { locale: ko })}
                    </td>
                  </tr>,
                  ...weeks.map((weekDays, weekIndex) => (
                    <tr key={`week-${monthIndex}-${weekIndex}`}>
                      {weekDays.map((date, dayIndex) => {
                        const status = getDateStatus(date, month);
                        const dayOfWeek = getDay(date); // 0 = 일요일, 6 = 토요일
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                        return (
                          <td
                            key={dayIndex}
                            className={`calendar-date-wrap ${
                              status === "outside"
                                ? "empty"
                                : status === "unselectable"
                                  ? ""
                                  : status === "started"
                                    ? "selected scheduled started"
                                    : status === "ended"
                                      ? "selected scheduled ended"
                                      : status === "scheduled"
                                        ? "scheduled"
                                        : ""
                            }`}
                            data-date={format(date, "yyyy-MM-dd")}
                            onMouseEnter={() => {
                              if (selectedStartDate && !selectedEndDate) {
                                setHoveredDate(date);
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredDate(null);
                            }}
                          >
                            {status !== "outside" && (
                              <button
                                type="button"
                                className={`calendar-date ${
                                  status === "unselectable"
                                    ? "unselectable"
                                    : isWeekend && status !== "started" && status !== "ended" && status !== "scheduled"
                                      ? "weekend"
                                      : ""
                                }`}
                                data-date={format(date, "yyyy-MM-dd")}
                                onClick={() => handleDateClick(date)}
                                disabled={disabled || status === "unselectable"}
                              >
                                <span className="num">{format(date, "dd")}</span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )),
                ];
              })}
          </tbody>
        </table>
      </div>
      <div className="option-btn-area flex flex-justify-end">
        <button
          type="button"
          className="btn btn-size-m bg-soft-primary primary txt-bold btn-apply"
          onClick={handleApply}
          disabled={disabled}
        >
          적용
        </button>
      </div>
    </div>
  );
}

