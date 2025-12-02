/**
 * API 클라이언트 설정
 * axios, fetch 등을 사용하여 구현하세요.
 */
import type { ApiError, ApiResponse } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

/**
 * API 클라이언트 기본 설정
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * GET 요청
   * 응답은 { status, msg, data } 형식으로 래핑되어 반환됨
   */
  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;


    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include", // 쿠키 자동 포함
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await this.handleError(response);
        // 개발 환경에서 상세 에러 로그
        if (process.env.NODE_ENV === "development") {
          console.error("[API Client] GET Error:", {
            url,
            status: error.status,
            message: error.message,
          });
        }
        throw error;
      }

      const result: ApiResponse<T> = await response.json();
      
      // data가 undefined인 경우를 방지
      if (result.data === undefined) {
        throw new Error("API response data is undefined");
      }
      return result.data;
    } catch (error) {
      // fetch 자체가 실패한 경우 (네트워크 에러, CORS 에러 등)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkError: ApiError = {
          status: 0,
          message: `Network error: ${error.message}`,
        };
        throw networkError;
      }
      // 기타 에러는 그대로 전달
      throw error;
    }
  }

  /**
   * POST 요청
   * 응답은 { status, msg, data } 형식으로 래핑되어 반환됨
   */
  async post<T>(
    endpoint: string,
    data: unknown,
    options?: { isFormData?: boolean },
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options?.isFormData || data instanceof FormData;

    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }


    const response = await fetch(url, {
      method: "POST",
      credentials: "include", // 쿠키 자동 포함
      headers,
      body: isFormData ? (data as FormData) : JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await this.handleError(response);
      // 개발 환경에서 상세 에러 로그
      if (process.env.NODE_ENV === "development") {
        console.error("[API Client] POST Error:", {
          url,
          status: error.status,
          message: error.message,
        });
      }
      throw error;
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  }

  /**
   * PUT 요청
   * 응답은 { status, msg, data } 형식으로 래핑되어 반환됨
   */
  async put<T>(
    endpoint: string,
    data: unknown,
    options?: { isFormData?: boolean },
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options?.isFormData || data instanceof FormData;

    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method: "PUT",
      credentials: "include", // 쿠키 자동 포함
      headers,
      body: isFormData ? (data as FormData) : JSON.stringify(data),
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  }

  /**
   * PATCH 요청
   * 응답은 { status, msg, data } 형식으로 래핑되어 반환됨
   */
  async patch<T>(
    endpoint: string,
    data: unknown,
    options?: { isFormData?: boolean },
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const isFormData = options?.isFormData || data instanceof FormData;

    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: isFormData ? (data as FormData) : JSON.stringify(data),
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  }

  /**
   * DELETE 요청
   * 응답은 { status, msg, data } 형식으로 래핑되어 반환됨 (void인 경우 data가 없을 수 있음)
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: "DELETE",
      credentials: "include", // 쿠키 자동 포함
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    // DELETE 요청의 경우 응답 본문이 없을 수 있음
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    const result: ApiResponse<T> = JSON.parse(text);
    return result.data;
  }

  /**
   * 에러 처리
   */
  private async handleError(response: Response): Promise<ApiError> {
    const error: ApiError = {
      message: response.statusText,
      status: response.status,
    };

    try {
      const data = await response.json();
      // msg 또는 message 필드에서 에러 메시지 추출
      error.message = data.msg || data.message || error.message;
      error.errors = data.errors;
    } catch {
      // JSON 파싱 실패 시 기본 에러 메시지 사용
    }

    // 개발 환경에서 상세 에러 정보 로그
    if (process.env.NODE_ENV === "development") {
      console.error("[API Client] Error Details:", {
        status: error.status,
        message: error.message,
        errors: error.errors,
        url: response.url,
      });
    }

    return error;
  }
}

/**
 * API 클라이언트 인스턴스
 */
export const apiClient = new ApiClient(API_BASE_URL);
