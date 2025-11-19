/**
 * 숫자 전용 입력 컴포넌트 (천 단위 구분자 자동 추가)
 */
"use client";

import { forwardRef, useState, useEffect } from "react";
import { Input, type InputProps } from "./input";
import { cn } from "@/lib/utils";

export interface NumberInputProps extends Omit<InputProps, "type" | "value" | "onChange"> {
  value?: number;
  onChange?: (value: number) => void;
  allowDecimals?: boolean;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, allowDecimals = false, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>("");

    // 숫자 값을 천 단위 구분자로 포맷팅
    const formatNumber = (num: number | undefined | null): string => {
      if (num === undefined || num === null || num === 0) {
        return "";
      }
      return num.toLocaleString("ko-KR");
    };

    // 포맷된 문자열을 숫자로 변환 (콤마 제거)
    const parseNumber = (str: string): number => {
      const cleaned = str.replace(/,/g, "");
      if (cleaned === "") return 0;
      const num = allowDecimals ? parseFloat(cleaned) : parseInt(cleaned, 10);
      return isNaN(num) ? 0 : num;
    };

    // value prop이 변경될 때 displayValue 업데이트
    useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(formatNumber(value));
      } else {
        setDisplayValue("");
      }
    }, [value, allowDecimals]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;

      // 숫자와 콤마만 허용 (소수점은 allowDecimals에 따라)
      const regex = allowDecimals ? /[^0-9,.]/g : /[^0-9,]/g;
      inputValue = inputValue.replace(regex, "");

      // 콤마 제거
      let cleanedValue = inputValue.replace(/,/g, "");

      // 빈 문자열이면 0으로 설정
      if (cleanedValue === "") {
        setDisplayValue("");
        onChange?.(0);
        return;
      }

      // 앞의 0 제거 (단, "0"만 입력한 경우는 유지)
      if (cleanedValue.length > 1 && cleanedValue.startsWith("0")) {
        cleanedValue = cleanedValue.replace(/^0+/, "") || "0";
      }

      // 숫자로 변환
      const numValue = allowDecimals 
        ? parseFloat(cleanedValue) 
        : parseInt(cleanedValue, 10);

      if (isNaN(numValue) || numValue < 0) {
        setDisplayValue("");
        onChange?.(0);
        return;
      }

      // 포맷팅하여 표시
      const formatted = numValue.toLocaleString("ko-KR");
      setDisplayValue(formatted);
      onChange?.(numValue);
    };

    const handleBlur = () => {
      // blur 시 값이 0이면 빈 문자열로 표시
      const numValue = parseNumber(displayValue);
      if (numValue === 0) {
        setDisplayValue("");
      } else {
        setDisplayValue(formatNumber(numValue));
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(className)}
        {...props}
      />
    );
  },
);

NumberInput.displayName = "NumberInput";

export { NumberInput };

