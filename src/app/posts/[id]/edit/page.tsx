/**
 * 게시글 수정 페이지
 */
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import type { ReceiveMethod, UpdatePostDto } from "@/types/domain";

import { getQueryKey, queryKeys } from "@/lib/query-keys";

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
import { usePostQuery, useUpdatePostMutation } from "@/queries/post";
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
 * 게시글 수정 페이지
 */

/**
 * 게시글 수정 페이지
 */

/**
 * 게시글 수정 페이지
 */

interface PostOptionInput {
  id?: number; // 기존 옵션 ID (수정 모드)
  name: string;
  deposit: number;
  fee: number;
}

interface ImageData {
  id?: number;
  file?: File; // 새로 추가된 파일
  url?: string; // 기존 이미지 URL
  isPrimary: boolean;
  isExisting?: boolean; // 기존 이미지인지 여부
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = Number(params.id);
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { data: me, isLoading: meLoading } = useMeQuery();
  const { data: post, isLoading: postLoading } = usePostQuery(postId);
  const updatePostMutation = useUpdatePostMutation();
  const { data: categories } = useCategoryListQuery();
  const { data: regions } = useRegionListQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 인증 상태 확인
  const currentUser = me ?? user;
  const authenticated = !!currentUser || isAuthenticated;

  // 인증 체크 및 작성자 확인
  useEffect(() => {
    if (meLoading || postLoading) return;
    if (!authenticated) {
      router.push(`/login?redirect=/posts/${postId}/edit`);
      return;
    }
    if (post && currentUser) {
      const isAuthor = Boolean(
        currentUser.id === (post.author?.id ?? post.authorId),
      );
      if (!isAuthor) {
        router.push(`/posts/${postId}`);
      }
    }
  }, [
    authenticated,
    meLoading,
    postLoading,
    post,
    currentUser,
    router,
    postId,
  ]);

  // 대분류 카테고리 및 시/도 지역
  const mainCategories = categories || [];
  const provinces = regions || [];

  const [formData, setFormData] = useState<Partial<UpdatePostDto>>({
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
  });

  const [selectedMainCategory, setSelectedMainCategory] = useState<
    number | null
  >(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(
    null,
  );
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedRegionIds, setSelectedRegionIds] = useState<number[]>([]);
  const [images, setImages] = useState<ImageData[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [options, setOptions] = useState<PostOptionInput[]>([]);

  // 게시글 데이터 로드 시 폼에 채워넣기
  useEffect(() => {
    if (!post || !categories || !regions) return;

    // 기본 정보
    setFormData({
      title: post.title || "",
      content: post.content || "",
      deposit: post.deposit || 0,
      fee: post.fee || 0,
      receiveMethod: post.receiveMethod || "ANY",
      returnMethod: post.returnMethod || "ANY",
      returnAddress1: post.returnAddress1 || "",
      returnAddress2: post.returnAddress2 || "",
      categoryId: post.categoryId || 0,
      regionIds: post.regionIds || [],
    });

    // 카테고리 설정 (categoryId는 무조건 소분류 ID)
    if (post.categoryId && mainCategories.length > 0) {
      let foundMainCategory: number | null = null;
      let foundSubCategory: number | null = null;

      // post.category가 있으면 사용
      if (post.category) {
        if (post.category.parentId) {
          // 소분류인 경우
          foundSubCategory = post.category.id;
          foundMainCategory = post.category.parentId;
        } else {
          // 대분류인 경우 (일반적이지 않지만 대비)
          foundMainCategory = post.category.id;
        }
      } else {
        // post.category가 없으면 모든 대분류를 순회하면서 소분류 찾기
        for (const mainCat of mainCategories) {
          const children = mainCat.child || mainCat.children || [];
          const foundSubCategoryItem = children.find(
            (child) => child.id === post.categoryId,
          );
          if (foundSubCategoryItem) {
            // 소분류를 찾았으면 대분류와 소분류 모두 설정
            foundSubCategory = foundSubCategoryItem.id;
            foundMainCategory = mainCat.id;
            break;
          }
        }
      }

      // 찾은 카테고리 설정
      if (foundMainCategory !== null) {
        setSelectedMainCategory(foundMainCategory);
      }
      if (foundSubCategory !== null) {
        setSelectedSubCategory(foundSubCategory);
      }
    }

    // 지역 설정 (chip 표시용으로만 selectedRegionIds 설정, select는 선택하지 않음)
    const regionIdsToUse =
      post.regionIds || (post.regions ? post.regions.map((r) => r.id) : []);

    if (regionIdsToUse.length > 0) {
      setSelectedRegionIds(regionIdsToUse);
      // select는 선택하지 않음 (selectedProvince, selectedDistrict는 null로 유지)
    }

    // 이미지 설정
    if (post.images && post.images.length > 0) {
      const imageData: ImageData[] = post.images.map((img) => ({
        id: img.id, // ← 추가: 서버에서 받은 이미지 ID
        url: img.file, // img.file이 실제 URL
        isPrimary: img.isPrimary || false,
        isExisting: true,
      }));
      setImages(imageData);
      setImagePreviews(imageData.map((img) => img.url || ""));
    }

    // 옵션 설정
    if (post.options && post.options.length > 0) {
      const optionData: PostOptionInput[] = post.options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        deposit: opt.deposit,
        fee: opt.fee,
      }));
      setOptions(optionData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, categories, regions]);

  // 다음 주소 검색 스크립트 로드
  useEffect(() => {
    if (window.daum && window.daum.Postcode) {
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
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
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
          if (data.bname !== "") {
            extraAddress += data.bname;
          }
          if (data.buildingName !== "") {
            extraAddress +=
              extraAddress !== ""
                ? `, ${data.buildingName}`
                : data.buildingName;
          }
          fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }

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

    const isFirstImage = images.length === 0;
    const newImageData: ImageData[] = files.map((file, fileIndex) => ({
      file,
      isPrimary: isFirstImage && fileIndex === 0,
      isExisting: false,
    }));

    const hasPrimary = images.some((img) => img.isPrimary);
    if (hasPrimary) {
      newImageData.forEach((img) => {
        img.isPrimary = false;
      });
    }

    const newImages = [...images, ...newImageData];
    setImages(newImages);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = (index: number) => {
    const imageToRemove = images[index];
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

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

    if (field === "name") {
      processedValue = value;
    } else if (field === "deposit" || field === "fee") {
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

    if (method !== "DELIVERY" && method !== "ANY") {
      setFormData((prev) => ({
        ...prev,
        returnMethod: method,
        returnAddress1: "",
        returnAddress2: "",
      }));
    }
  };

  // 대분류 선택 시 소분류 필터링
  const selectedMainCategoryData = mainCategories.find(
    (cat) => cat.id === selectedMainCategory,
  );
  const filteredSubCategories =
    selectedMainCategoryData?.child || selectedMainCategoryData?.children || [];

  // 시/도 선택 시 시/군/구 필터링
  const selectedProvinceData = provinces.find(
    (province) => province.id === selectedProvince,
  );
  const filteredDistricts =
    selectedProvinceData?.child || selectedProvinceData?.children || [];

  // 지역 제거 핸들러
  const handleRemoveRegion = (regionId: number) => {
    setSelectedRegionIds(selectedRegionIds.filter((id) => id !== regionId));
    if (regionId === selectedProvince) {
      setSelectedProvince(null);
    }
  };

  // 선택된 지역 이름 가져오기 (부모-자식 관계 포함)
  const getSelectedRegionNames = () => {
    const result: Array<{ id: number; name: string; parentId?: number }> = [];
    const processedProvinces = new Set<number>();

    // 각 시/도에 대해 확인
    for (const province of provinces) {
      const districts = province.child || province.children || [];
      if (districts.length === 0) {
        // 하위 지역이 없는 시/도인 경우, 직접 선택되었는지 확인
        if (selectedRegionIds.includes(province.id)) {
          result.push({
            id: province.id,
            name: province.name,
          });
        }
        continue;
      }

      const districtIds = districts.map((d) => d.id);
      const selectedDistrictIds = selectedRegionIds.filter((id) =>
        districtIds.includes(id),
      );

      // 해당 시/도의 모든 시/군/구가 선택되어 있는지 확인
      const allDistrictsSelected =
        selectedDistrictIds.length > 0 &&
        selectedDistrictIds.length === districtIds.length &&
        selectedRegionIds.includes(province.id);

      if (allDistrictsSelected) {
        // 모든 시/군/구가 선택되어 있으면 시/도만 표시
        result.push({
          id: province.id,
          name: province.name,
        });
        processedProvinces.add(province.id);
      } else if (selectedDistrictIds.length > 0) {
        // 일부 시/군/구만 선택되어 있으면 각 시/군/구를 개별적으로 표시
        for (const districtId of selectedDistrictIds) {
          const district = districts.find((d) => d.id === districtId);
          if (district) {
            result.push({
              id: districtId,
              name: `${province.name} > ${district.name}`,
              parentId: province.id,
            });
          }
        }
        processedProvinces.add(province.id);
      } else if (selectedRegionIds.includes(province.id)) {
        // 시/도만 선택된 경우 (하위 시/군/구가 없거나 선택되지 않음)
        result.push({ id: province.id, name: province.name });
        processedProvinces.add(province.id);
      }
    }

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // selectedRegionIds와 formData.regionIds 둘 다 확인
    const currentRegionIds =
      selectedRegionIds.length > 0
        ? selectedRegionIds
        : formData.regionIds || [];

    if (currentRegionIds.length === 0) {
      alert("지역을 선택해주세요.");
      return;
    }

    // 이미지 검증 (기존 이미지 + 새 이미지 포함하여 최소 1개 이상)
    if (images.length === 0) {
      alert("최소 1개 이상의 이미지를 등록해주세요.");
      return;
    }

    const deposit = Math.max(0, formData.deposit ?? 0);
    const fee = Math.max(0, formData.fee ?? 0);

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

    // ✅ 이미지 데이터 구성 (ID 포함)
    const imagesData = images.map((imageData) => ({
      id: imageData.id || null, // ← 수정: 기존 이미지면 ID, 새 이미지면 null
      isPrimary: imageData.isPrimary,
    }));

    // FormData 생성
    const formDataToSend = new FormData();

    const requestData = {
      title: formData.title || "",
      content: formData.content || "",
      receiveMethod: formData.receiveMethod || "DIRECT",
      returnMethod: returnMethod,
      returnAddress1: returnAddress1,
      returnAddress2: returnAddress2,
      regionIds: currentRegionIds.map((id) => Number(id)),
      categoryId: Number(selectedSubCategory || formData.categoryId || 0),
      deposit: deposit,
      fee: fee,
      options: optionsData,
      images: imagesData, // ← ID 포함된 데이터
    };

    const requestBlob = new Blob([JSON.stringify(requestData)], {
      type: "application/json",
    });
    formDataToSend.append("request", requestBlob);

    // ✅ 새로 추가된 이미지만 파일로 전송
    images.forEach((imageData) => {
      if (imageData.file) {
        // file이 있으면 새 이미지
        formDataToSend.append("images", imageData.file);
      }
    });


    try {
      // mutation 실행 (캐시 업데이트는 mutation의 onSuccess에서 처리)
      await updatePostMutation.mutateAsync({
        postId,
        data: formDataToSend as unknown as UpdatePostDto,
      });

      // 상세 페이지 데이터를 prefetch하여 캐시에 로드
      await queryClient.prefetchQuery({
        queryKey: getQueryKey(queryKeys.post.detail(postId)),
        queryFn: async () => {
          const { getPost } = await import("@/api/endpoints/post");
          return getPost(postId);
        },
      });

      // prefetch 완료 후 navigate
      router.push(`/posts/${postId}`);
    } catch (error) {
      console.error("Update post failed:", error);
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
  if (meLoading || postLoading || !authenticated || !post) {
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

  // 작성자 확인 (게시글 상세 페이지와 동일한 방식)
  const isAuthor = Boolean(
    currentUser?.id === (post.author?.id ?? post.authorId),
  );
  if (!isAuthor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-gray-500">
            게시글을 수정할 권한이 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl">게시글 수정</CardTitle>
          <CardDescription>대여할 물품 정보를 수정해주세요</CardDescription>
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
                placeholder="예) 가볍게 즐기는 초보자용 캠핑 텐트"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={updatePostMutation.isPending}
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
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base placeholder:text-gray-400 placeholder:whitespace-pre-line focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={`장비 상태, 사용 기간, 구성품, 주의사항 등을 자세히 적어주세요.

예)
• 사용 기간: 1년
• 상태: 생활 기스 약간 있음
• 구성품: 본체 + 배터리 2개 + 충전기
• 비고: 파손 시 수리비 부담 부탁드립니다.
`}
                value={formData.content}
                onChange={handleChange}
                required
                disabled={updatePostMutation.isPending}
              />
            </div>

            {/* 카테고리 및 지역 선택 - 생성 페이지와 동일한 로직 */}
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
                  disabled={updatePostMutation.isPending}
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
                    !selectedMainCategory || updatePostMutation.isPending
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
                    if (value) {
                      const provinceData = provinces.find(
                        (p) => p.id === value,
                      );
                      if (provinceData) {
                        const districts =
                          provinceData.child || provinceData.children || [];
                        const districtIds = districts.map((d) => d.id);

                        const newRegionIds = selectedRegionIds.filter(
                          (id) => id !== value && !districtIds.includes(id),
                        );

                        const allRegionIds = [
                          ...newRegionIds,
                          value,
                          ...districtIds,
                        ];
                        setSelectedRegionIds(
                          allRegionIds.length > 0 ? allRegionIds : [],
                        );
                      }
                    }
                  }}
                  disabled={updatePostMutation.isPending}
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
                  value={
                    selectedDistrict === null && selectedProvince
                      ? "all"
                      : selectedDistrict || ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "all" && selectedProvince) {
                      const districts = filteredDistricts;
                      const districtIds = districts.map((d) => d.id);

                      const newRegionIds = selectedRegionIds.filter(
                        (id) =>
                          id !== selectedProvince && !districtIds.includes(id),
                      );

                      const allRegionIds = [
                        ...newRegionIds,
                        selectedProvince,
                        ...districtIds,
                      ];
                      setSelectedRegionIds(
                        allRegionIds.length > 0 ? allRegionIds : [],
                      );
                      setSelectedDistrict(null);
                    } else if (value) {
                      const districtId = Number(value);
                      setSelectedDistrict(districtId);

                      if (selectedProvince) {
                        const provinceData = provinces.find(
                          (p) => p.id === selectedProvince,
                        );
                        if (provinceData) {
                          const districts =
                            provinceData.child || provinceData.children || [];
                          const districtIds = districts.map((d) => d.id);

                          const allDistrictsSelected =
                            districtIds.every((id) =>
                              selectedRegionIds.includes(id),
                            ) && selectedRegionIds.includes(selectedProvince);

                          let newRegionIds = selectedRegionIds;

                          if (allDistrictsSelected) {
                            newRegionIds = selectedRegionIds.filter(
                              (id) =>
                                id !== selectedProvince &&
                                !districtIds.includes(id),
                            );
                          } else {
                            newRegionIds = selectedRegionIds.includes(
                              selectedProvince,
                            )
                              ? selectedRegionIds.filter(
                                  (id) => id !== selectedProvince,
                                )
                              : selectedRegionIds;
                          }

                          if (!newRegionIds.includes(districtId)) {
                            newRegionIds = [...newRegionIds, districtId];
                          }

                          setSelectedRegionIds(newRegionIds);

                          const selectedDistrictIds = newRegionIds.filter(
                            (id) => districtIds.includes(id),
                          );

                          if (
                            selectedDistrictIds.length === districtIds.length &&
                            !newRegionIds.includes(selectedProvince)
                          ) {
                            setSelectedRegionIds([
                              ...newRegionIds,
                              selectedProvince,
                            ]);
                          }
                        }
                      }
                    }
                  }}
                  disabled={!selectedProvince || updatePostMutation.isPending}
                >
                  <option value="">시/군/구 선택</option>
                  <option value="all">전체</option>
                  {filteredDistricts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 선택된 지역 Chip 표시 */}
            {getSelectedRegionNames().length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {getSelectedRegionNames().map((region) => (
                  <div
                    key={region.id}
                    className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                  >
                    <span>{region.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (region.parentId) {
                          handleRemoveRegion(region.id);
                        } else {
                          const province = provinces.find(
                            (p) => p.id === region.id,
                          );
                          if (province) {
                            const districts =
                              province.child || province.children || [];
                            const districtIds = districts.map((d) => d.id);
                            setSelectedRegionIds(
                              selectedRegionIds.filter(
                                (id) =>
                                  id !== region.id && !districtIds.includes(id),
                              ),
                            );
                          } else {
                            handleRemoveRegion(region.id);
                          }
                        }
                      }}
                      className="ml-1 hover:text-green-600"
                      disabled={updatePostMutation.isPending}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
                  disabled={updatePostMutation.isPending}
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
                  disabled={updatePostMutation.isPending}
                />
              </div>
            </div>

            {/* 사진 업로드 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">사진 (최대 10장)</label>
              <div className="space-y-4">
                {/* 이미지 미리보기 */}
                {images.length > 0 && (
                  <div className="grid grid-cols-5 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={
                            image.file ? imagePreviews[index] : image.url || ""
                          }
                          alt={`Preview ${index + 1}`}
                          fill
                          className="rounded-lg object-cover"
                        />
                        {image.isPrimary && (
                          <div className="absolute left-2 top-2 rounded-full bg-yellow-400 p-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-600" />
                          </div>
                        )}
                        {!image.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(index)}
                            className="absolute left-2 top-2 rounded-full bg-gray-800 bg-opacity-50 p-1 text-white hover:bg-opacity-70"
                            title="대표 이미지로 설정"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        )}
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
                {images.length < 10 && (
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
                      disabled={updatePostMutation.isPending}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 수령 방법 및 반납 방법 - 생성 페이지와 동일 */}
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
                        disabled={updatePostMutation.isPending}
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
                        disabled={updatePostMutation.isPending}
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
                        disabled={updatePostMutation.isPending}
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
                        disabled={updatePostMutation.isPending}
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
                        disabled={updatePostMutation.isPending}
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
                        disabled={updatePostMutation.isPending}
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

            {/* 반납 주소 입력 */}
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
                    disabled={updatePostMutation.isPending}
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
                    disabled={updatePostMutation.isPending}
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
                  disabled={updatePostMutation.isPending}
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
                  disabled={updatePostMutation.isPending}
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
                            placeholder="예) 랜턴 추가"
                            value={option.name}
                            onChange={(e) =>
                              handleOptionChange(index, "name", e.target.value)
                            }
                            disabled={updatePostMutation.isPending}
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
                            disabled={updatePostMutation.isPending}
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
                            disabled={updatePostMutation.isPending}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleRemoveOption(index)}
                            disabled={updatePostMutation.isPending}
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

            {updatePostMutation.isError && (
              <p className="text-sm text-red-600">
                게시글 수정에 실패했습니다. 다시 시도해주세요.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={updatePostMutation.isPending}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updatePostMutation.isPending}
              >
                {updatePostMutation.isPending ? "수정 중..." : "수정하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
