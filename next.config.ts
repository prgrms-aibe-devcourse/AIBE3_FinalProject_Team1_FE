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
    // 로컬 개발 환경에서도 이미지 최적화 허용
    unoptimized: process.env.NODE_ENV === "development" ? false : false,
  },
};

export default nextConfig;
