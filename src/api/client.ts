/**
 * API 클라이언트 설정
 * axios, fetch 등을 사용하여 구현하세요.
 */
import type { ApiError } from "@/types/api";

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
   * 응답은 객체 자체를 반환 (data 래퍼 없음)
   */
  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // 개발 환경에서 쿠키 전송 확인
    if (process.env.NODE_ENV === "development") {
      console.log("[API Client] GET Request:", url);
      console.log("[API Client] Credentials:", "include");
    }

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

    return response.json();
  }

  /**
   * POST 요청
   * 응답은 객체 자체를 반환 (data 래퍼 없음)
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

    // 개발 환경에서 쿠키 전송 확인
    if (process.env.NODE_ENV === "development") {
      console.log("[API Client] POST Request:", url);
      console.log("[API Client] Credentials:", "include");
      console.log("[API Client] IsFormData:", isFormData);
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

    return response.json();
  }

  /**
   * PUT 요청
   * 응답은 객체 자체를 반환 (data 래퍼 없음)
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

    return response.json();
  }

  /**
   * DELETE 요청
   * 응답은 객체 자체를 반환 (data 래퍼 없음)
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

    return response.json();
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
      error.message = data.message || error.message;
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
