/**
 * 마이페이지 - 내 게시글
 */
"use client";

import Image from "next/image";
import Link from "next/link";

import type { Post } from "@/types/domain";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useMyPostsQuery } from "@/queries/post";

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

/**
 * 마이페이지 - 내 게시글
 */

export default function MyPostsPage() {
  const { data: myPosts, isLoading: postsLoading } = useMyPostsQuery();

  if (postsLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200" />
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const posts = Array.isArray(myPosts) ? myPosts : myPosts?.data || [];

  return (
    <div className="p-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">내 게시글</h1>
        <Link href="/posts/new">
          <Button>게시글 작성</Button>
        </Link>
      </div>
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">작성한 게시글이 없습니다.</p>
            <Link href="/posts/new">
              <Button>게시글 작성하기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: Post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                {post.images && post.images.length > 0 && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={post.images[0].url}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="mb-2 text-lg font-semibold line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-blue-600">
                      보증금: {post.deposit.toLocaleString()}원
                    </span>
                    <span className="text-gray-500">
                      {post.fee.toLocaleString()}원/일
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
