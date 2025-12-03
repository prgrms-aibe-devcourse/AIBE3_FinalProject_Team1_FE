"use client";

import { useState } from "react";
import { Tag, Plus, Trash2, Edit2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCategoryListQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/queries/category";

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategoryListQuery();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<{
    id: number;
    name: string;
    isParent: boolean;
  } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingParent, setIsCreatingParent] = useState(false);
  const [isCreatingChild, setIsCreatingChild] = useState(false);

  // 상위 카테고리 목록 (parentId가 null인 카테고리들)
  const parentCategories =
    categories?.filter((c) => !c.parentId) || [];

  // 선택한 상위 카테고리의 하위 카테고리 목록
  const childCategories =
    selectedParentId !== null
      ? categories?.find((c) => c.id === selectedParentId)?.child || []
      : [];

  const handleSelectParent = (parentId: number) => {
    setSelectedParentId(parentId);
    setEditingCategory(null);
    setIsCreatingChild(false);
  };

  const handleCreateParent = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await createMutation.mutateAsync({
        name: newCategoryName.trim(),
        parentId: undefined,
      });
      setNewCategoryName("");
      setIsCreatingParent(false);
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const handleCreateChild = async () => {
    if (!newCategoryName.trim() || selectedParentId === null) return;

    try {
      await createMutation.mutateAsync({
        name: newCategoryName.trim(),
        parentId: selectedParentId,
      });
      setNewCategoryName("");
      setIsCreatingChild(false);
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const handleUpdate = async (categoryId: number, name: string) => {
    if (!name.trim()) return;

    try {
      await updateMutation.mutateAsync({
        categoryId,
        data: { name: name.trim() },
      });
      setEditingCategory(null);
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const handleDelete = async (categoryId: number, isParent: boolean) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteMutation.mutateAsync(categoryId);
      if (isParent && selectedParentId === categoryId) {
        setSelectedParentId(null);
      }
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">카테고리 관리</h2>
        <p className="text-gray-600 mt-1">
          상위 카테고리 및 하위 카테고리를 관리할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 상위 카테고리 목록 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              상위 카테고리
            </h3>
            <Button
              size="sm"
              onClick={() => {
                setIsCreatingParent(true);
                setIsCreatingChild(false);
                setNewCategoryName("");
                setEditingCategory(null);
              }}
              disabled={isCreatingParent}
            >
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          </div>

          {/* 상위 카테고리 추가 폼 */}
          {isCreatingParent && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Input
                placeholder="카테고리명을 입력하세요"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateParent();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setIsCreatingParent(false);
                    setNewCategoryName("");
                  }
                }}
                autoFocus
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateParent}
                  disabled={
                    !newCategoryName.trim() || createMutation.isPending
                  }
                >
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreatingParent(false);
                    setNewCategoryName("");
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          )}

          {/* 상위 카테고리 목록 */}
          <div className="space-y-2">
            {parentCategories.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                상위 카테고리가 없습니다.
              </p>
            ) : (
              parentCategories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedParentId === category.id
                      ? "bg-purple-50 border-purple-200"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                  onClick={() => handleSelectParent(category.id)}
                >
                  <div className="flex-1">
                    {editingCategory?.id === category.id &&
                    editingCategory.isParent ? (
                      <Input
                        value={editingCategory.name}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            name: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleUpdate(category.id, editingCategory.name);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setEditingCategory(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="h-8"
                      />
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900">
                          {category.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {category.child?.length || 0}개 하위 카테고리
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {editingCategory?.id === category.id &&
                    editingCategory.isParent ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdate(category.id, editingCategory.name);
                          }}
                          disabled={updateMutation.isPending}
                        >
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(null);
                          }}
                        >
                          취소
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory({
                              id: category.id,
                              name: category.name,
                              isParent: true,
                            });
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(category.id, true);
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 오른쪽: 하위 카테고리 목록 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedParentId !== null
                ? `${
                    parentCategories.find((c) => c.id === selectedParentId)
                      ?.name || ""
                  } 하위 카테고리`
                : "하위 카테고리"}
            </h3>
            <Button
              size="sm"
              onClick={() => {
                setIsCreatingChild(true);
                setIsCreatingParent(false);
                setNewCategoryName("");
                setEditingCategory(null);
              }}
              disabled={isCreatingChild || selectedParentId === null}
            >
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          </div>

          {selectedParentId === null ? (
            <div className="text-center py-12 text-gray-500">
              <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>상위 카테고리를 선택해주세요.</p>
            </div>
          ) : (
            <>
              {/* 하위 카테고리 추가 폼 */}
              {isCreatingChild && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Input
                    placeholder="카테고리명을 입력하세요"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateChild();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setIsCreatingChild(false);
                        setNewCategoryName("");
                      }
                    }}
                    autoFocus
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateChild}
                      disabled={
                        !newCategoryName.trim() || createMutation.isPending
                      }
                    >
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingChild(false);
                        setNewCategoryName("");
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}

              {/* 하위 카테고리 목록 */}
              <div className="space-y-2">
                {childCategories.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">
                    하위 카테고리가 없습니다.
                  </p>
                ) : (
                  childCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <div className="flex-1">
                        {editingCategory?.id === category.id &&
                        !editingCategory.isParent ? (
                          <Input
                            value={editingCategory.name}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                name: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleUpdate(category.id, editingCategory.name);
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                setEditingCategory(null);
                              }
                            }}
                            autoFocus
                            className="h-8"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">
                            {category.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {editingCategory?.id === category.id &&
                        !editingCategory.isParent ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleUpdate(category.id, editingCategory.name)
                              }
                              disabled={updateMutation.isPending}
                            >
                              저장
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingCategory(null)}
                            >
                              취소
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setEditingCategory({
                                  id: category.id,
                                  name: category.name,
                                  isParent: false,
                                })
                              }
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(category.id, false)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
