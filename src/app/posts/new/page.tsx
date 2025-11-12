/**
 * 게시글 작성 페이지
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreatePostMutation } from "@/queries/post";
import { useCategoryListQuery } from "@/queries/category";
import { useRegionListQuery } from "@/queries/region";
import type { CreatePostDto, ReceiveMethod } from "@/types/domain";

export default function NewPostPage() {
  const router = useRouter();
  const createPostMutation = useCreatePostMutation();
  const { data: categories } = useCategoryListQuery();
  const { data: regions } = useRegionListQuery();

  const [formData, setFormData] = useState<Partial<CreatePostDto>>({
    title: "",
    content: "",
    deposit: 0,
    fee: 0,
    receiveMethod: "DIRECT" as ReceiveMethod,
    returnMethod: "DIRECT" as ReceiveMethod,
    categoryId: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await createPostMutation.mutateAsync(
        formData as CreatePostDto,
      );
      router.push(`/posts/${response.id}`);
    } catch (error) {
      console.error("Create post failed:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "deposit" || name === "fee" || name === "categoryId"
          ? Number(value)
          : value,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">게시글 작성</CardTitle>
          <CardDescription>
            대여할 장비 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                제목
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={createPostMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                장비 정보
              </label>
              <textarea
                id="content"
                name="content"
                rows={10}
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.content}
                onChange={handleChange}
                required
                disabled={createPostMutation.isPending}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="deposit" className="text-sm font-medium">
                  보증금 (원)
                </label>
                <Input
                  id="deposit"
                  name="deposit"
                  type="number"
                  value={formData.deposit}
                  onChange={handleChange}
                  required
                  disabled={createPostMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fee" className="text-sm font-medium">
                  1일 대여금 (원)
                </label>
                <Input
                  id="fee"
                  name="fee"
                  type="number"
                  value={formData.fee}
                  onChange={handleChange}
                  required
                  disabled={createPostMutation.isPending}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="receiveMethod" className="text-sm font-medium">
                  수령 방법
                </label>
                <select
                  id="receiveMethod"
                  name="receiveMethod"
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.receiveMethod}
                  onChange={handleChange}
                  required
                  disabled={createPostMutation.isPending}
                >
                  <option value="DIRECT">직거래</option>
                  <option value="DELIVERY">택배</option>
                  <option value="BOTH">상관없음</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="returnMethod" className="text-sm font-medium">
                  반납 방법
                </label>
                <select
                  id="returnMethod"
                  name="returnMethod"
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.returnMethod}
                  onChange={handleChange}
                  required
                  disabled={createPostMutation.isPending}
                >
                  <option value="DIRECT">직거래</option>
                  <option value="DELIVERY">택배</option>
                  <option value="BOTH">상관없음</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="categoryId" className="text-sm font-medium">
                카테고리
              </label>
              <select
                id="categoryId"
                name="categoryId"
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.categoryId}
                onChange={handleChange}
                required
                disabled={createPostMutation.isPending}
              >
                <option value={0}>카테고리 선택</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {createPostMutation.isError && (
              <p className="text-sm text-red-600">
                게시글 작성에 실패했습니다. 다시 시도해주세요.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createPostMutation.isPending}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending ? "작성 중..." : "작성하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

