/**
 * 게시글 작성 페이지
 */
"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import type { CreatePostDto, ReceiveMethod } from "@/types/domain";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";

import { useAuthStore } from "@/store/authStore";

import { useCategoryListQuery } from "@/queries/category";
import { useCreatePostMutation } from "@/queries/post";
import { useRegionListQuery } from "@/queries/region";
import { useMeQuery } from "@/queries/user";

import {
  Camera,
  CheckCircle,
  Info,
  MapPin,
  Plus,
  Star,
  Truck,
  User,
  X,
} from "lucide-react";

/**
 * 게시글 작성 페이지
 */

/**
 * 게시글 작성 페이지
 */

/**
 * 게시글 작성 페이지
 */

/**
 * 게시글 작성 페이지
 */

/**
 * 게시글 작성 페이지
 */

/**
 * 게시글 작성 페이지
 */

/**
 * 게시글 작성 페이지
 */

/**
 * 게시글 작성 페이지
 */

/**
 * 게시글 작성 페이지
 */

interface PostOptionInput {
  name: string;
  deposit: number;
  fee: number;
}

export default function NewPostPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { data: me, isLoading: meLoading } = useMeQuery();
  const createPostMutation = useCreatePostMutation();
  const { data: categories } = useCategoryListQuery();
  const { data: regions } = useRegionListQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 인증 상태 확인 (me API 호출 결과 또는 스토어의 사용자 정보)
  const currentUser = me ?? user;
  const authenticated = !!currentUser || isAuthenticated;

  // 인증 체크: 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (meLoading) return; // 로딩 중이면 대기
    if (!authenticated) {
      router.push("/login?redirect=/posts/new");
    }
  }, [authenticated, meLoading, router]);

  // 대분류 카테고리 (child 배열을 가진 것들, 즉 최상위 카테고리)
  const mainCategories = categories || [];

  // 시/도 지역 (child 배열을 가진 것들, 즉 최상위 지역)
  const provinces = regions || [];

  const [formData, setFormData] = useState<Partial<CreatePostDto>>({
    title: "",
    content: "",
    deposit: 0,
    fee: 0,
    receiveMethod: "ANY" as ReceiveMethod,
    returnMethod: "ANY" as ReceiveMethod,
    returnAddress1: "",
    returnAddress2: "",
    categoryId: 0,
    regionIds: [],
    imageUrls: [],
  });

  const [selectedMainCategory, setSelectedMainCategory] = useState<
    number | null
  >(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(
    null,
  );
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  interface ImageData {
    file: File;
    isPrimary: boolean;
  }
  const [images, setImages] = useState<ImageData[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [options, setOptions] = useState<PostOptionInput[]>([]);

  // 다음 주소 검색 스크립트 로드
  useEffect(() => {
    // 이미 로드되어 있는지 확인
    if (window.daum && window.daum.Postcode) {
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거 (다른 컴포넌트에서 사용 중일 수 있으므로 확인 필요)
      try {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      } catch {
        // 스크립트가 이미 제거되었을 수 있음
      }
    };
  }, []);

  // 다음 주소 검색 팝업 열기
  const handleOpenAddressSearch = () => {
    if (typeof window === "undefined" || !window.daum) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: daum.PostcodeData) {
        // 도로명 주소 선택 시
        let fullAddress = data.address;
        let extraAddress = "";

        // 주소 타입에 따라 추가 정보 구성
        if (data.addressType === "R") {
          // 도로명 주소인 경우
          if (data.bname !== "") {
            extraAddress += data.bname;
          }
          if (data.buildingName !== "") {
            extraAddress +=
              extraAddress !== ""
                ? `, ${data.buildingName}`
                : data.buildingName;
          }
          // 추가 정보가 있으면 주소에 추가
          fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }

        // 도로명 주소 필드에 값 설정
        setFormData({
          ...formData,
          returnAddress1: fullAddress,
        });
      },
      width: "100%",
      height: "100%",
    }).open({
      q: formData.returnAddress1 || "",
      left: window.screen.width / 2 - 300,
      top: window.screen.height / 2 - 300,
    });
  };

  // 이미지 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      alert("최대 10장까지 업로드 가능합니다.");
      return;
    }

    // 첫 번째 이미지는 자동으로 대표 이미지로 설정 (현재 이미지가 없을 경우)
    const isFirstImage = images.length === 0;
    const newImageData: ImageData[] = files.map((file, fileIndex) => ({
      file,
      isPrimary: isFirstImage && fileIndex === 0,
    }));

    // 기존 이미지들 중 대표 이미지가 있으면 새 이미지는 모두 false
    const hasPrimary = images.some((img) => img.isPrimary);
    if (hasPrimary) {
      newImageData.forEach((img) => {
        img.isPrimary = false;
      });
    }

    const newImages = [...images, ...newImageData];
    setImages(newImages);

    // 미리보기 생성
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = (index: number) => {
    const imageToRemove = images[index];
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // 삭제된 이미지가 대표 이미지였던 경우, 첫 번째 이미지를 대표로 설정
    if (imageToRemove.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }

    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // 대표 이미지 설정 핸들러
  const handleSetPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setImages(newImages);
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
    let processedValue: string | number = value;

    // deposit과 fee는 NumberInput에서 직접 처리되므로 그대로 사용
    if (field === "name") {
      processedValue = value;
    } else if (field === "deposit" || field === "fee") {
      // NumberInput에서 이미 숫자로 변환되어 전달됨
      processedValue = typeof value === "number" ? value : Number(value) || 0;
    } else {
      processedValue = Number(value);
    }

    newOptions[index] = {
      ...newOptions[index],
      [field]: processedValue,
    };
    setOptions(newOptions);
  };

  // 옵션의 NumberInput용 핸들러
  const handleOptionNumberChange = (
    index: number,
    field: "deposit" | "fee",
    value: number,
  ) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value,
    };
    setOptions(newOptions);
  };

  // 수령 방법 변경 핸들러
  const handleReceiveMethodChange = (method: ReceiveMethod) => {
    setFormData({ ...formData, receiveMethod: method });
  };

  // 반납 방법 변경 핸들러
  const handleReturnMethodChange = (method: ReceiveMethod) => {
    setFormData({ ...formData, returnMethod: method });

    // 택배 방식이 없으면 반납 주소 초기화
    if (method !== "DELIVERY" && method !== "ANY") {
      setFormData((prev) => ({
        ...prev,
        returnMethod: method,
        returnAddress1: "",
        returnAddress2: "",
      }));
    }
  };

  // 대분류 선택 시 소분류 필터링 (child 배열 사용)
  const selectedMainCategoryData = mainCategories.find(
    (cat) => cat.id === selectedMainCategory,
  );
  const filteredSubCategories =
    selectedMainCategoryData?.child || selectedMainCategoryData?.children || [];

  // 시/도 선택 시 시/군/구 필터링 (child 배열 사용)
  const selectedProvinceData = provinces.find(
    (province) => province.id === selectedProvince,
  );
  const filteredDistricts =
    selectedProvinceData?.child || selectedProvinceData?.children || [];

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

    // 요금과 보증금 음수 검증
    const deposit = Math.max(0, formData.deposit ?? 0);
    const fee = Math.max(0, formData.fee ?? 0);

    // 반납 방식에 택배가 포함되면 반납 주소 추가
    const returnMethod = formData.returnMethod || "DIRECT";
    const returnAddress1 =
      returnMethod === "DELIVERY" || returnMethod === "ANY"
        ? formData.returnAddress1 || null
        : null;
    const returnAddress2 =
      returnMethod === "DELIVERY" || returnMethod === "ANY"
        ? formData.returnAddress2 || null
        : null;

    // 옵션 데이터 구성
    const optionsData =
      options.length > 0
        ? options
            .filter((option) => option.name.trim())
            .map((option) => ({
              name: option.name,
              deposit: Math.max(0, option.deposit ?? 0),
              fee: Math.max(0, option.fee ?? 0),
            }))
        : [];

    // 이미지 데이터 구성 (isPrimary만 포함)
    const imagesData = images.map((imageData) => ({
      isPrimary: imageData.isPrimary,
    }));

    // request JSON 데이터 구성
    const requestData = {
      title: formData.title || "",
      content: formData.content || "",
      receiveMethod: formData.receiveMethod || "DIRECT",
      returnMethod: returnMethod,
      returnAddress1: returnAddress1,
      returnAddress2: returnAddress2,
      regionIds: selectedRegionIds.map((id) => Number(id)),
      categoryId: Number(selectedSubCategory || formData.categoryId || 0),
      deposit: deposit,
      fee: fee,
      options: optionsData,
      images: imagesData,
    };

    // FormData 생성
    const formDataToSend = new FormData();

    // request part: JSON Blob으로 추가
    const requestBlob = new Blob([JSON.stringify(requestData)], {
      type: "application/json",
    });
    formDataToSend.append("request", requestBlob);

    // file part: 각 파일을 "file"로 추가 (서버에서 List<MultipartFile>로 받음)
    images.forEach((imageData) => {
      formDataToSend.append("file", imageData.file);
    });

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
    let processedValue: string | number = value;

    if (name === "categoryId") {
      processedValue = Number(value);
    } else {
      // deposit과 fee는 NumberInput에서 직접 처리
      processedValue = value;
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  // NumberInput용 핸들러
  const handleNumberChange = (name: "deposit" | "fee", value: number) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // 로딩 중이거나 인증되지 않은 경우
  if (meLoading || !authenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

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
                    const value = e.target.value
                      ? Number(e.target.value)
                      : null;
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
                    const value = e.target.value
                      ? Number(e.target.value)
                      : null;
                    setSelectedSubCategory(value);
                    setFormData({
                      ...formData,
                      categoryId: value || formData.categoryId || 0,
                    });
                  }}
                  disabled={
                    !selectedMainCategory || createPostMutation.isPending
                  }
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
                    const value = e.target.value
                      ? Number(e.target.value)
                      : null;
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
                    const value = e.target.value
                      ? Number(e.target.value)
                      : null;
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
                <NumberInput
                  id="fee"
                  value={formData.fee || 0}
                  onChange={(value) => handleNumberChange("fee", value)}
                  required
                  disabled={createPostMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="deposit" className="text-sm font-medium">
                  보증금
                </label>
                <NumberInput
                  id="deposit"
                  value={formData.deposit || 0}
                  onChange={(value) => handleNumberChange("deposit", value)}
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
                        {/* 대표 이미지 표시 */}
                        {images[index]?.isPrimary && (
                          <div className="absolute left-2 top-2 rounded-full bg-yellow-400 p-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-600" />
                          </div>
                        )}
                        {/* 대표 이미지 설정 버튼 */}
                        {!images[index]?.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(index)}
                            className="absolute left-2 top-2 rounded-full bg-gray-800 bg-opacity-50 p-1 text-white hover:bg-opacity-70"
                            title="대표 이미지로 설정"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        )}
                        {/* 이미지 삭제 버튼 */}
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

            {/* 수령 방법 및 반납 방법 */}
            <div className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* 수령 방식 */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    수령 방식 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label
                      className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50"
                      style={{
                        borderColor:
                          formData.receiveMethod === "DIRECT"
                            ? "#2563eb"
                            : "#e5e7eb",
                        backgroundColor:
                          formData.receiveMethod === "DIRECT"
                            ? "#eff6ff"
                            : "transparent",
                      }}
                    >
                      <input
                        type="radio"
                        name="receiveMethod"
                        value="DIRECT"
                        checked={formData.receiveMethod === "DIRECT"}
                        onChange={() =>
                          handleReceiveMethodChange("DIRECT" as ReceiveMethod)
                        }
                        disabled={createPostMutation.isPending}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="flex-1">만나서</span>
                    </label>
                    <label
                      className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50"
                      style={{
                        borderColor:
                          formData.receiveMethod === "DELIVERY"
                            ? "#2563eb"
                            : "#e5e7eb",
                        backgroundColor:
                          formData.receiveMethod === "DELIVERY"
                            ? "#eff6ff"
                            : "transparent",
                      }}
                    >
                      <input
                        type="radio"
                        name="receiveMethod"
                        value="DELIVERY"
                        checked={formData.receiveMethod === "DELIVERY"}
                        onChange={() =>
                          handleReceiveMethodChange("DELIVERY" as ReceiveMethod)
                        }
                        disabled={createPostMutation.isPending}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <Truck className="h-5 w-5 text-gray-600" />
                      <span className="flex-1">택배</span>
                    </label>
                    <label
                      className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50"
                      style={{
                        borderColor:
                          formData.receiveMethod === "ANY"
                            ? "#2563eb"
                            : "#e5e7eb",
                        backgroundColor:
                          formData.receiveMethod === "ANY"
                            ? "#eff6ff"
                            : "transparent",
                      }}
                    >
                      <input
                        type="radio"
                        name="receiveMethod"
                        value="ANY"
                        checked={formData.receiveMethod === "ANY"}
                        onChange={() =>
                          handleReceiveMethodChange("ANY" as ReceiveMethod)
                        }
                        disabled={createPostMutation.isPending}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <CheckCircle className="h-5 w-5 text-gray-600" />
                      <span className="flex-1">상관없음</span>
                    </label>
                  </div>
                </div>

                {/* 반납 방식 */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    반납 방식 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label
                      className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50"
                      style={{
                        borderColor:
                          formData.returnMethod === "DIRECT"
                            ? "#2563eb"
                            : "#e5e7eb",
                        backgroundColor:
                          formData.returnMethod === "DIRECT"
                            ? "#eff6ff"
                            : "transparent",
                      }}
                    >
                      <input
                        type="radio"
                        name="returnMethod"
                        value="DIRECT"
                        checked={formData.returnMethod === "DIRECT"}
                        onChange={() =>
                          handleReturnMethodChange("DIRECT" as ReceiveMethod)
                        }
                        disabled={createPostMutation.isPending}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="flex-1">만나서</span>
                    </label>
                    <label
                      className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50"
                      style={{
                        borderColor:
                          formData.returnMethod === "DELIVERY"
                            ? "#2563eb"
                            : "#e5e7eb",
                        backgroundColor:
                          formData.returnMethod === "DELIVERY"
                            ? "#eff6ff"
                            : "transparent",
                      }}
                    >
                      <input
                        type="radio"
                        name="returnMethod"
                        value="DELIVERY"
                        checked={formData.returnMethod === "DELIVERY"}
                        onChange={() =>
                          handleReturnMethodChange("DELIVERY" as ReceiveMethod)
                        }
                        disabled={createPostMutation.isPending}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <Truck className="h-5 w-5 text-gray-600" />
                      <span className="flex-1">택배</span>
                    </label>
                    <label
                      className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50"
                      style={{
                        borderColor:
                          formData.returnMethod === "ANY"
                            ? "#2563eb"
                            : "#e5e7eb",
                        backgroundColor:
                          formData.returnMethod === "ANY"
                            ? "#eff6ff"
                            : "transparent",
                      }}
                    >
                      <input
                        type="radio"
                        name="returnMethod"
                        value="ANY"
                        checked={formData.returnMethod === "ANY"}
                        onChange={() =>
                          handleReturnMethodChange("ANY" as ReceiveMethod)
                        }
                        disabled={createPostMutation.isPending}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <CheckCircle className="h-5 w-5 text-gray-600" />
                      <span className="flex-1">상관없음</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 안내 박스 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <Info className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      수령/반납 방식 안내
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• 만나서: 직접 만나서 수령/반납</li>
                      <li>• 택배: 택배로 발송/반납 (택배비 별도)</li>
                      <li>• 상관없음: 대여자가 선택 가능</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 반납 주소 입력 (택배 방식 선택 시, 전체 너비) */}
            {(formData.returnMethod === "DELIVERY" ||
              formData.returnMethod === "ANY") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  반납 주소 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="도로명 주소를 검색해주세요"
                    value={formData.returnAddress1 || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        returnAddress1: e.target.value,
                      })
                    }
                    disabled={createPostMutation.isPending}
                    required={
                      formData.returnMethod === "DELIVERY" ||
                      formData.returnMethod === "ANY"
                    }
                    className="flex-1"
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenAddressSearch}
                    disabled={createPostMutation.isPending}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <MapPin className="h-4 w-4" />
                    주소 검색
                  </Button>
                </div>
                <Input
                  type="text"
                  placeholder="상세 주소 (예: 123-45, 101호)"
                  value={formData.returnAddress2 || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      returnAddress2: e.target.value,
                    })
                  }
                  disabled={createPostMutation.isPending}
                  className="w-full"
                />
              </div>
            )}

            {/* 추가 옵션 */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-300">
                <h3 className="text-xl font-semibold text-gray-900">
                  추가 옵션{" "}
                  <span className="text-sm font-normal text-gray-500">
                    (선택사항)
                  </span>
                </h3>
                <Button
                  type="button"
                  onClick={handleAddOption}
                  disabled={createPostMutation.isPending}
                  className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 border-0 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  옵션 추가
                </Button>
              </div>

              {options.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">옵션을 추가하지 않아도 됩니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {options.map((option, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            옵션명
                          </label>
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
                          <label className="text-sm font-medium text-gray-700">
                            추가 요금
                          </label>
                          <NumberInput
                            placeholder="0"
                            value={option.fee || 0}
                            onChange={(value) =>
                              handleOptionNumberChange(index, "fee", value)
                            }
                            disabled={createPostMutation.isPending}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            추가 보증금
                          </label>
                          <NumberInput
                            placeholder="0"
                            value={option.deposit || 0}
                            onChange={(value) =>
                              handleOptionNumberChange(index, "deposit", value)
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
                            className="w-full"
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
