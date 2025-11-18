import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 공개 경로 (로그인 없이 접근 가능)
 */
const publicPaths = ["/", "/login", "/signup", "/posts"];

/**
 * 공개 경로인지 확인
 */
function isPublicPath(pathname: string): boolean {
  // 정확히 일치하는 경로
  if (publicPaths.includes(pathname)) {
    return true;
  }

  // /posts/[id] 형식의 동적 경로
  if (pathname.startsWith("/posts/") && pathname !== "/posts/new") {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로는 통과
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 다른 도메인으로 API 요청 시 쿠키가 middleware에 전달되지 않을 수 있음
  // 따라서 middleware에서 인증 체크를 하지 않고, 클라이언트 사이드에서만 인증 체크
  // 모든 경로를 통과시킴 (인증 체크는 각 페이지 컴포넌트에서 처리)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청 경로에 매칭:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

