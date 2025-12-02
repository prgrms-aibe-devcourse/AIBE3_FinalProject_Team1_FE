import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8080",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
    // presigned URL 사용 시 이미지 최적화 비활성화
    // presigned URL은 쿼리 파라미터와 만료 시간이 있어 Next.js 서버가 재요청할 때 실패할 수 있음
    unoptimized: true,
  },
};

export default nextConfig;
