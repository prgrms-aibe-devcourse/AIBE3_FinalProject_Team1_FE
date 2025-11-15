"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2, Edit2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useRegionListQuery,
  useCreateRegionMutation,
  useUpdateRegionMutation,
  useDeleteRegionMutation,
} from "@/queries/region";

export default function AdminRegionsPage() {
  const { data: regions, isLoading } = useRegionListQuery();
  const createMutation = useCreateRegionMutation();
  const updateMutation = useUpdateRegionMutation();
  const deleteMutation = useDeleteRegionMutation();

  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [editingRegion, setEditingRegion] = useState<{
    id: number;
    name: string;
    isParent: boolean;
  } | null>(null);
  const [newRegionName, setNewRegionName] = useState("");
  const [isCreatingParent, setIsCreatingParent] = useState(false);
  const [isCreatingChild, setIsCreatingChild] = useState(false);

  // 상위 지역 목록 (parentId가 null인 지역들)
  const parentRegions =
    regions?.filter((r) => !r.parentId) || [];

  // 선택한 상위 지역의 하위 지역 목록
  const childRegions =
    selectedParentId !== null
      ? regions?.find((r) => r.id === selectedParentId)?.child || []
      : [];

  const handleSelectParent = (parentId: number) => {
    setSelectedParentId(parentId);
    setEditingRegion(null);
    setIsCreatingChild(false);
  };

  const handleCreateParent = async () => {
    if (!newRegionName.trim()) return;

    try {
      await createMutation.mutateAsync({
        name: newRegionName.trim(),
        parentId: undefined,
      });
      setNewRegionName("");
      setIsCreatingParent(false);
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const handleCreateChild = async () => {
    if (!newRegionName.trim() || selectedParentId === null) return;

    try {
      await createMutation.mutateAsync({
        name: newRegionName.trim(),
        parentId: selectedParentId,
      });
      setNewRegionName("");
      setIsCreatingChild(false);
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const handleUpdate = async (regionId: number, name: string) => {
    if (!name.trim()) return;

    try {
      await updateMutation.mutateAsync({
        regionId,
        data: { name: name.trim() },
      });
      setEditingRegion(null);
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const handleDelete = async (regionId: number, isParent: boolean) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteMutation.mutateAsync(regionId);
      if (isParent && selectedParentId === regionId) {
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
        <h2 className="text-2xl font-bold text-gray-900">지역 관리</h2>
        <p className="text-gray-600 mt-1">
          시/도 및 시/군/구 지역을 관리할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 상위 지역 목록 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">상위 지역</h3>
            <Button
              size="sm"
              onClick={() => {
                setIsCreatingParent(true);
                setIsCreatingChild(false);
                setNewRegionName("");
                setEditingRegion(null);
              }}
              disabled={isCreatingParent}
            >
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          </div>

          {/* 상위 지역 추가 폼 */}
          {isCreatingParent && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Input
                placeholder="지역명을 입력하세요"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateParent();
                  } else if (e.key === "Escape") {
                    setIsCreatingParent(false);
                    setNewRegionName("");
                  }
                }}
                autoFocus
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateParent}
                  disabled={!newRegionName.trim() || createMutation.isPending}
                >
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreatingParent(false);
                    setNewRegionName("");
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          )}

          {/* 상위 지역 목록 */}
          <div className="space-y-2">
            {parentRegions.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                상위 지역이 없습니다.
              </p>
            ) : (
              parentRegions.map((region) => (
                <div
                  key={region.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedParentId === region.id
                      ? "bg-purple-50 border-purple-200"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                  onClick={() => handleSelectParent(region.id)}
                >
                  <div className="flex-1">
                    {editingRegion?.id === region.id && editingRegion.isParent ? (
                      <Input
                        value={editingRegion.name}
                        onChange={(e) =>
                          setEditingRegion({
                            ...editingRegion,
                            name: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(region.id, editingRegion.name);
                          } else if (e.key === "Escape") {
                            setEditingRegion(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="h-8"
                      />
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900">{region.name}</p>
                        <p className="text-xs text-gray-500">
                          {region.child?.length || 0}개 하위 지역
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {editingRegion?.id === region.id && editingRegion.isParent ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdate(region.id, editingRegion.name);
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
                            setEditingRegion(null);
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
                            setEditingRegion({
                              id: region.id,
                              name: region.name,
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
                            handleDelete(region.id, true);
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

        {/* 오른쪽: 하위 지역 목록 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedParentId !== null
                ? `${
                    parentRegions.find((r) => r.id === selectedParentId)?.name ||
                    ""
                  } 하위 지역`
                : "하위 지역"}
            </h3>
            <Button
              size="sm"
              onClick={() => {
                setIsCreatingChild(true);
                setIsCreatingParent(false);
                setNewRegionName("");
                setEditingRegion(null);
              }}
              disabled={isCreatingChild || selectedParentId === null}
            >
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          </div>

          {selectedParentId === null ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>상위 지역을 선택해주세요.</p>
            </div>
          ) : (
            <>
              {/* 하위 지역 추가 폼 */}
              {isCreatingChild && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Input
                    placeholder="지역명을 입력하세요"
                    value={newRegionName}
                    onChange={(e) => setNewRegionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateChild();
                      } else if (e.key === "Escape") {
                        setIsCreatingChild(false);
                        setNewRegionName("");
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
                        !newRegionName.trim() || createMutation.isPending
                      }
                    >
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingChild(false);
                        setNewRegionName("");
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}

              {/* 하위 지역 목록 */}
              <div className="space-y-2">
                {childRegions.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">
                    하위 지역이 없습니다.
                  </p>
                ) : (
                  childRegions.map((region) => (
                    <div
                      key={region.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <div className="flex-1">
                        {editingRegion?.id === region.id &&
                        !editingRegion.isParent ? (
                          <Input
                            value={editingRegion.name}
                            onChange={(e) =>
                              setEditingRegion({
                                ...editingRegion,
                                name: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdate(region.id, editingRegion.name);
                              } else if (e.key === "Escape") {
                                setEditingRegion(null);
                              }
                            }}
                            autoFocus
                            className="h-8"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">
                            {region.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {editingRegion?.id === region.id &&
                        !editingRegion.isParent ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleUpdate(region.id, editingRegion.name)
                              }
                              disabled={updateMutation.isPending}
                            >
                              저장
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingRegion(null)}
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
                                setEditingRegion({
                                  id: region.id,
                                  name: region.name,
                                  isParent: false,
                                })
                              }
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(region.id, false)}
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
