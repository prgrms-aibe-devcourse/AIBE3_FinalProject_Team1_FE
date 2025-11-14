/**
 * 게시글 작성 페이지
 */
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, X, Plus } from "lucide-react";

import type { CreatePostDto, ReceiveMethod, PostOption, Region } from "@/types/domain";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useCategoryListQuery } from "@/queries/category";
import { useRegionListQuery } from "@/queries/region";
import { useCreatePostMutation } from "@/queries/post";

interface PostOptionInput {
  name: string;
  deposit: number;
  fee: number;
}

export default function NewPostPage() {
  const router = useRouter();
  const createPostMutation = useCreatePostMutation();
  const { data: categories } = useCategoryListQuery();
  const { data: regions } = useRegionListQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 대분류 카테고리 (parentId가 null인 것들)
  const mainCategories = categories?.filter((cat) => !cat.parentId) || [];
  // 소분류 카테고리 (parentId가 있는 것들)
  const subCategories = categories?.filter((cat) => cat.parentId) || [];

  // 시/도 지역 (parentId가 null인 것들)
  const provinces = regions?.filter((region) => !region.parentId) || [];
  // 시/군/구 지역 (parentId가 있는 것들)
  const districts = regions?.filter((region) => region.parentId) || [];

  const [formData, setFormData] = useState<Partial<CreatePostDto>>({
    title: "",
    content: "",
    deposit: 0,
    fee: 0,
    receiveMethod: "DIRECT" as ReceiveMethod,
    returnMethod: "DIRECT" as ReceiveMethod,
    categoryId: 0,
    regionIds: [],
    imageUrls: [],
  });

  const [selectedMainCategory, setSelectedMainCategory] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [options, setOptions] = useState<PostOptionInput[]>([]);
  const [receiveMethods, setReceiveMethods] = useState<{
    delivery: boolean;
    direct: boolean;
  }>({ delivery: false, direct: true });
  const [returnMethods, setReturnMethods] = useState<{
    delivery: boolean;
    direct: boolean;
  }>({ delivery: false, direct: true });

  // 이미지 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      alert("최대 10장까지 업로드 가능합니다.");
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // 미리보기 생성
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // 옵션 추가 핸들러
  const handleAddOption = () => {
    setOptions([...options, { name: "", deposit: 0, fee: 0 }]);
  };

  // 옵션 삭제 핸들러
  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  // 옵션 변경 핸들러
  const handleOptionChange = (
    index: number,
    field: keyof PostOptionInput,
    value: string | number,
  ) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: field === "name" ? value : Number(value),
    };
    setOptions(newOptions);
  };

  // 수령 방법 변경 핸들러
  const handleReceiveMethodChange = (type: "delivery" | "direct", checked: boolean) => {
    const newMethods = { ...receiveMethods, [type]: checked };
    setReceiveMethods(newMethods);

    // 둘 다 선택되면 BOTH, 하나만 선택되면 해당 값, 둘 다 안 선택되면 DIRECT
    if (newMethods.delivery && newMethods.direct) {
      setFormData({ ...formData, receiveMethod: "BOTH" as ReceiveMethod });
    } else if (newMethods.delivery) {
      setFormData({ ...formData, receiveMethod: "DELIVERY" as ReceiveMethod });
    } else if (newMethods.direct) {
      setFormData({ ...formData, receiveMethod: "DIRECT" as ReceiveMethod });
    } else {
      setFormData({ ...formData, receiveMethod: "DIRECT" as ReceiveMethod });
    }
  };

  // 반납 방법 변경 핸들러
  const handleReturnMethodChange = (type: "delivery" | "direct", checked: boolean) => {
    const newMethods = { ...returnMethods, [type]: checked };
    setReturnMethods(newMethods);

    // 둘 다 선택되면 BOTH, 하나만 선택되면 해당 값, 둘 다 안 선택되면 DIRECT
    if (newMethods.delivery && newMethods.direct) {
      setFormData({ ...formData, returnMethod: "BOTH" as ReceiveMethod });
    } else if (newMethods.delivery) {
      setFormData({ ...formData, returnMethod: "DELIVERY" as ReceiveMethod });
    } else if (newMethods.direct) {
      setFormData({ ...formData, returnMethod: "DIRECT" as ReceiveMethod });
    } else {
      setFormData({ ...formData, returnMethod: "DIRECT" as ReceiveMethod });
    }
  };

  // 대분류 선택 시 소분류 필터링
  const filteredSubCategories = selectedMainCategory
    ? subCategories.filter((cat) => cat.parentId === selectedMainCategory)
    : [];

  // 시/도 선택 시 시/군/구 필터링
  const filteredDistricts = selectedProvince
    ? districts.filter((district) => district.parentId === selectedProvince)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 지역 선택 검증
    const selectedRegionIds: number[] = [];
    if (selectedProvince) selectedRegionIds.push(selectedProvince);
    if (selectedDistrict) selectedRegionIds.push(selectedDistrict);

    if (selectedRegionIds.length === 0) {
      alert("지역을 선택해주세요.");
      return;
    }

    // FormData 생성
    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title || "");
    formDataToSend.append("content", formData.content || "");
    formDataToSend.append("deposit", String(formData.deposit || 0));
    formDataToSend.append("fee", String(formData.fee || 0));
    formDataToSend.append("receiveMethod", formData.receiveMethod || "DIRECT");
    formDataToSend.append("returnMethod", formData.returnMethod || "DIRECT");
    formDataToSend.append("categoryId", String(selectedSubCategory || formData.categoryId || 0));

    // 지역 ID 배열 추가
    selectedRegionIds.forEach((regionId) => {
      formDataToSend.append("regionIds", String(regionId));
    });

    // 이미지 파일 추가
    images.forEach((image) => {
      formDataToSend.append("images", image);
    });

    // 옵션 추가 (옵션이 있는 경우)
    if (options.length > 0) {
      options.forEach((option, index) => {
        if (option.name.trim()) {
          formDataToSend.append(`options[${index}].name`, option.name);
          formDataToSend.append(`options[${index}].deposit`, String(option.deposit));
          formDataToSend.append(`options[${index}].fee`, String(option.fee));
        }
      });
    }

    try {
      const response = await createPostMutation.mutateAsync(
        formDataToSend as unknown as CreatePostDto,
      );
      router.push(`/posts/${response.id}`);
    } catch (error) {
      console.error("Create post failed:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl">게시글 등록</CardTitle>
          <CardDescription>대여할 물품 정보를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                제목 <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                placeholder="대여할 물품의 제목을 입력하세요"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={createPostMutation.isPending}
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                rows={6}
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="물품에 대한 자세한 설명을 입력하세요"
                value={formData.content}
                onChange={handleChange}
                required
                disabled={createPostMutation.isPending}
              />
            </div>

            {/* 카테고리 및 지역 선택 */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* 대분류 */}
              <div className="space-y-2">
                <label htmlFor="mainCategory" className="text-sm font-medium">
                  대분류 <span className="text-red-500">*</span>
                </label>
                <select
                  id="mainCategory"
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedMainCategory || ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setSelectedMainCategory(value);
                    setSelectedSubCategory(null);
                  }}
                  required
                  disabled={createPostMutation.isPending}
                >
                  <option value="">카테고리 선택</option>
                  {mainCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 소분류 */}
              <div className="space-y-2">
                <label htmlFor="subCategory" className="text-sm font-medium">
                  소분류
                </label>
                <select
                  id="subCategory"
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  value={selectedSubCategory || ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setSelectedSubCategory(value);
                    setFormData({
                      ...formData,
                      categoryId: value || formData.categoryId || 0,
                    });
                  }}
                  disabled={!selectedMainCategory || createPostMutation.isPending}
                >
                  <option value="">세부 카테고리 선택</option>
                  {filteredSubCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 시/도 */}
              <div className="space-y-2">
                <label htmlFor="province" className="text-sm font-medium">
                  시/도 <span className="text-red-500">*</span>
                </label>
                <select
                  id="province"
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedProvince || ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setSelectedProvince(value);
                    setSelectedDistrict(null);
                  }}
                  required
                  disabled={createPostMutation.isPending}
                >
                  <option value="">시/도 선택</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 시/군/구 */}
              <div className="space-y-2">
                <label htmlFor="district" className="text-sm font-medium">
                  시/군/구
                </label>
                <select
                  id="district"
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  value={selectedDistrict || ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setSelectedDistrict(value);
                  }}
                  disabled={!selectedProvince || createPostMutation.isPending}
                >
                  <option value="">시/군/구 선택</option>
                  {filteredDistricts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 대여료 및 보증금 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="fee" className="text-sm font-medium">
                  대여료(일) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="fee"
                  name="fee"
                  type="number"
                  value={formData.fee || 0}
                  onChange={handleChange}
                  required
                  disabled={createPostMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="deposit" className="text-sm font-medium">
                  보증금
                </label>
                <Input
                  id="deposit"
                  name="deposit"
                  type="number"
                  value={formData.deposit || 0}
                  onChange={handleChange}
                  disabled={createPostMutation.isPending}
                />
              </div>
            </div>

            {/* 사진 업로드 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">사진 (최대 10장)</label>
              <div className="space-y-4">
                {/* 이미지 미리보기 */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(index)}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 이미지 업로드 버튼 */}
                {imagePreviews.length < 10 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50"
                  >
                    <Camera className="mb-2 h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-600">사진을 선택하세요</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={createPostMutation.isPending}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 추가 옵션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">추가 옵션</h3>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-sm text-blue-600 hover:text-blue-700"
                  disabled={createPostMutation.isPending}
                >
                  + 옵션 추가
                </button>
              </div>

              {options.map((option, index) => (
                <div key={index} className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">옵션명</label>
                    <Input
                      placeholder="옵션명을 입력하세요"
                      value={option.name}
                      onChange={(e) =>
                        handleOptionChange(index, "name", e.target.value)
                      }
                      disabled={createPostMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">추가 요금</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={option.fee}
                      onChange={(e) =>
                        handleOptionChange(index, "fee", e.target.value)
                      }
                      disabled={createPostMutation.isPending}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveOption(index)}
                      disabled={createPostMutation.isPending}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* 수령 방법 및 반납 방법 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">수령 방법</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={receiveMethods.delivery}
                      onChange={(e) =>
                        handleReceiveMethodChange("delivery", e.target.checked)
                      }
                      disabled={createPostMutation.isPending}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>택배</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={receiveMethods.direct}
                      onChange={(e) =>
                        handleReceiveMethodChange("direct", e.target.checked)
                      }
                      disabled={createPostMutation.isPending}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>직접 만나서</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">반납 방법</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={returnMethods.delivery}
                      onChange={(e) =>
                        handleReturnMethodChange("delivery", e.target.checked)
                      }
                      disabled={createPostMutation.isPending}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>택배</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={returnMethods.direct}
                      onChange={(e) =>
                        handleReturnMethodChange("direct", e.target.checked)
                      }
                      disabled={createPostMutation.isPending}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>직접 만나서</span>
                  </label>
                </div>
              </div>
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
                {createPostMutation.isPending ? "등록 중..." : "등록하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
