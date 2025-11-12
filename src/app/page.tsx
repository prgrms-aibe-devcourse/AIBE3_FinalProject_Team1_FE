/**
 * 홈 페이지
 */
"use client";

import Image from "next/image";
import Link from "next/link";

import type { Post } from "@/types/domain";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { usePostListQuery } from "@/queries/post";

import {
  Camera,
  MessageSquare,
  Search,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

/**
 * 홈 페이지
 */

export default function Home() {
  const { data: postsData, isLoading } = usePostListQuery();
  const posts = Array.isArray(postsData) ? postsData : postsData?.data || [];
  const featuredPosts = posts.slice(0, 6);

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 py-24 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-5xl font-bold md:text-6xl lg:text-7xl">
                P2P 취미 장비 대여 플랫폼
              </h1>
              <p className="mb-10 text-xl text-blue-50 md:text-2xl">
                필요한 장비를 쉽고 빠르게 대여하세요
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/posts">
                  <button className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-lg font-medium text-blue-600 shadow-lg transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    <Search className="mr-2 h-5 w-5" />
                    게시글 보기
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-6 py-3 text-lg font-medium text-white shadow-lg transition-colors hover:bg-white hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2">
                    시작하기
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 md:text-4xl">
              주요 기능
            </h2>
            <p className="mb-12 text-center text-gray-600">
              안전하고 편리한 장비 대여 서비스를 제공합니다
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border-2 border-transparent transition-all hover:border-blue-200 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">다양한 장비</CardTitle>
                  <CardDescription className="text-base">
                    카메라, 렌즈, 조명 등 다양한 장비를 대여할 수 있습니다
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-2 border-transparent transition-all hover:border-blue-200 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">안전한 거래</CardTitle>
                  <CardDescription className="text-base">
                    보증금 시스템으로 안전하게 거래할 수 있습니다
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-2 border-transparent transition-all hover:border-blue-200 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">실시간 채팅</CardTitle>
                  <CardDescription className="text-base">
                    대여자와 실시간으로 소통할 수 있습니다
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Posts Section */}
        {!isLoading && featuredPosts.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
                    인기 게시글
                  </h2>
                  <p className="mt-2 text-gray-600">
                    지금 가장 인기 있는 장비를 확인하세요
                  </p>
                </div>
                <Link href="/posts">
                  <Button variant="outline" className="hidden sm:flex">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    더보기
                  </Button>
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredPosts.map((post: Post) => (
                  <Link key={post.id} href={`/posts/${post.id}`}>
                    <Card className="group h-full transition-all hover:shadow-xl">
                      {post.images && post.images.length > 0 && (
                        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                          <Image
                            src={post.images[0].url}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <h3 className="mb-2 text-lg font-semibold line-clamp-2 group-hover:text-blue-600">
                          {post.title}
                        </h3>
                        <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-semibold text-blue-600">
                              {post.deposit.toLocaleString()}원
                            </span>
                            <span className="text-gray-500">
                              {post.fee.toLocaleString()}원/일
                            </span>
                          </div>
                          <Star className="h-4 w-4 text-yellow-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="mt-8 text-center sm:hidden">
                <Link href="/posts">
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    더보기
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
