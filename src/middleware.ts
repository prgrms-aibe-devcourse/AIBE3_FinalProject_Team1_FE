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

  // 쿠키에서 인증 토큰 확인
  // HttpOnly 쿠키는 JavaScript에서 접근할 수 없으므로
  // 서버 사이드에서만 확인 가능
  // 일반적인 인증 쿠키 이름들을 확인
  const cookieNames = [
    "accessToken",
    "refreshToken",
    "token",
    "authToken",
    "access_token",
    "refresh_token",
  ];
  
  const hasAuthCookie = cookieNames.some((name) => request.cookies.has(name));

  // 인증이 필요한 경로이고 쿠키가 없으면 로그인 페이지로 리다이렉트
  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

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

