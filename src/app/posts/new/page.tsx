/**
 * 게시글 작성 페이지
 */
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, X, Star, MapPin } from "lucide-react";

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

  // 대분류 카테고리 (child 배열을 가진 것들, 즉 최상위 카테고리)
  const mainCategories = categories || [];
  
  // 시/도 지역 (child 배열을 가진 것들, 즉 최상위 지역)
  const provinces = regions || [];

  const [formData, setFormData] = useState<Partial<CreatePostDto>>({
    title: "",
    content: "",
    deposit: 0,
    fee: 0,
    receiveMethod: "DIRECT" as ReceiveMethod,
    returnMethod: "DIRECT" as ReceiveMethod,
    returnAddress1: "",
    returnAddress2: "",
    categoryId: 0,
    regionIds: [],
    imageUrls: [],
  });

  const [selectedMainCategory, setSelectedMainCategory] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  interface ImageData {
    file: File;
    isPrimary: boolean;
  }
  const [images, setImages] = useState<ImageData[]>([]);
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
              extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
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
    
    if (field === "deposit" || field === "fee") {
      const numValue = Number(value);
      // 음수 값은 0으로 제한
      processedValue = numValue < 0 ? 0 : numValue;
    } else if (field === "name") {
      processedValue = value;
    } else {
      processedValue = Number(value);
    }
    
    newOptions[index] = {
      ...newOptions[index],
      [field]: processedValue,
    };
    setOptions(newOptions);
  };

  // 수령 방법 변경 핸들러
  const handleReceiveMethodChange = (type: "delivery" | "direct", checked: boolean) => {
    const newMethods = { ...receiveMethods, [type]: checked };
    setReceiveMethods(newMethods);

    // 둘 다 선택되면 ANY, 택배만 선택되면 DELIVERY, 직거래만 선택되면 DIRECT, 둘 다 안 선택되면 DIRECT
    if (newMethods.delivery && newMethods.direct) {
      setFormData({ ...formData, receiveMethod: "ANY" as ReceiveMethod });
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

    // 둘 다 선택되면 ANY, 택배만 선택되면 DELIVERY, 직거래만 선택되면 DIRECT, 둘 다 안 선택되면 DIRECT
    const newReturnMethod =
      newMethods.delivery && newMethods.direct
        ? ("ANY" as ReceiveMethod)
        : newMethods.delivery
          ? ("DELIVERY" as ReceiveMethod)
          : newMethods.direct
            ? ("DIRECT" as ReceiveMethod)
            : ("DIRECT" as ReceiveMethod);

    setFormData({ ...formData, returnMethod: newReturnMethod });
    
    // 택배 방식이 없으면 반납 주소 초기화
    if (!newMethods.delivery) {
      setFormData((prev) => ({
        ...prev,
        returnMethod: newReturnMethod,
        returnAddress1: "",
        returnAddress2: "",
      }));
    }
  };

  // 대분류 선택 시 소분류 필터링 (child 배열 사용)
  const selectedMainCategoryData = mainCategories.find(
    (cat) => cat.id === selectedMainCategory,
  );
  const filteredSubCategories = selectedMainCategoryData?.child || selectedMainCategoryData?.children || [];

  // 시/도 선택 시 시/군/구 필터링 (child 배열 사용)
  const selectedProvinceData = provinces.find(
    (province) => province.id === selectedProvince,
  );
  const filteredDistricts = selectedProvinceData?.child || selectedProvinceData?.children || [];

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

    // FormData 생성
    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title || "");
    formDataToSend.append("content", formData.content || "");
    // deposit과 fee는 0이어도 항상 보냄 (음수는 0으로 처리)
    formDataToSend.append("deposit", String(deposit));
    formDataToSend.append("fee", String(fee));
    formDataToSend.append("receiveMethod", formData.receiveMethod || "DIRECT");
    formDataToSend.append("returnMethod", formData.returnMethod || "DIRECT");
    
    // 반납 방식에 택배가 포함되면 반납 주소 추가
    const returnMethod = formData.returnMethod || "DIRECT";
    if (returnMethod === "DELIVERY" || returnMethod === "ANY") {
      if (formData.returnAddress1) {
        formDataToSend.append("returnAddress1", formData.returnAddress1);
      }
      if (formData.returnAddress2) {
        formDataToSend.append("returnAddress2", formData.returnAddress2);
      }
    }
    
    formDataToSend.append("categoryId", String(selectedSubCategory || formData.categoryId || 0));

    // 지역 ID 배열 추가
    selectedRegionIds.forEach((regionId) => {
      formDataToSend.append("regionIds", String(regionId));
    });

    // 이미지 파일 추가 (file과 isPrimary를 객체 형태로)
    images.forEach((imageData, index) => {
      formDataToSend.append(`images[${index}].file`, imageData.file);
      formDataToSend.append(
        `images[${index}].isPrimary`,
        String(imageData.isPrimary),
      );
    });

    // 옵션 추가 (옵션이 있는 경우)
    if (options.length > 0) {
      options.forEach((option, index) => {
        if (option.name.trim()) {
          // 옵션의 deposit과 fee도 음수 검증
          const optionDeposit = Math.max(0, option.deposit ?? 0);
          const optionFee = Math.max(0, option.fee ?? 0);
          formDataToSend.append(`options[${index}].name`, option.name);
          formDataToSend.append(`options[${index}].deposit`, String(optionDeposit));
          formDataToSend.append(`options[${index}].fee`, String(optionFee));
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
    let processedValue: string | number = value;
    
    if (name === "deposit" || name === "fee") {
      const numValue = Number(value);
      // 음수 값은 0으로 제한
      processedValue = numValue < 0 ? 0 : numValue;
    } else if (name === "categoryId") {
      processedValue = Number(value);
    }
    
    setFormData({
      ...formData,
      [name]: processedValue,
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
                  min="0"
                  step="1"
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
                  min="0"
                  step="1"
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
                      min="0"
                      step="1"
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

            {/* 반납 주소 입력 (택배 방식 선택 시, 전체 너비) */}
            {(returnMethods.delivery || formData.returnMethod === "ANY") && (
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
                      returnMethods.delivery || formData.returnMethod === "ANY"
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
