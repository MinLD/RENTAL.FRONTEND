"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import type { ApiResult } from "@/services/api-error";
import type { CategoryRefreshHandler } from "@/components/admin/catalog/categories/category-management-types";
import type {
  CatalogCategoryDetail,
  CreateCatalogCategoryRequest,
  UpdateCatalogCategoryRequest,
} from "@/types/catalog";

type UseAdminCategoriesControllerParams = {
  createCategory: (
    request: CreateCatalogCategoryRequest,
  ) => Promise<ApiResult<CatalogCategoryDetail>>;
  fetchCategoryDetail: (id: string) => Promise<ApiResult<CatalogCategoryDetail>>;
  updateCategory: (
    id: string,
    request: UpdateCatalogCategoryRequest,
  ) => Promise<ApiResult<CatalogCategoryDetail>>;
};

export function useAdminCategoriesController({
  createCategory,
  fetchCategoryDetail,
  updateCategory,
}: UseAdminCategoriesControllerParams) {
  const [selectedCategory, setSelectedCategory] =
    useState<CatalogCategoryDetail | null>(null);
  const [categoryDetail, setCategoryDetail] =
    useState<CatalogCategoryDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [createRefresh, setCreateRefresh] =
    useState<CategoryRefreshHandler | null>(null);
  const [detailRefresh, setDetailRefresh] =
    useState<CategoryRefreshHandler | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const detailRequestId = useRef(0);

  function handleOpenCreateCategory(refresh: CategoryRefreshHandler) {
    setCreateRefresh(() => refresh);
    setIsCreateDrawerOpen(true);
  }

  async function handleCreateCategory(request: CreateCatalogCategoryRequest) {
    setIsCreatingCategory(true);

    try {
      const result = await createCategory(request);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Đã tạo danh mục.");
      setIsCreateDrawerOpen(false);
      createRefresh?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo danh mục.",
      );
    } finally {
      setIsCreatingCategory(false);
    }
  }

  async function handleViewCategory(
    category: CatalogCategoryDetail,
    refresh?: CategoryRefreshHandler,
  ) {
    const requestId = ++detailRequestId.current;

    setSelectedCategory(category);
    setCategoryDetail(null);
    setDetailError(null);
    setDetailRefresh(() => refresh ?? null);
    setIsLoadingDetail(true);

    try {
      const nextCategoryDetail = await fetchCategoryDetail(category.id);

      if (requestId === detailRequestId.current) {
        if (!nextCategoryDetail.success) {
          setDetailError(nextCategoryDetail.error.message);
          return;
        }
        setCategoryDetail(nextCategoryDetail.data);
      }
    } catch (error) {
      if (requestId === detailRequestId.current) {
        setDetailError(
          error instanceof Error
            ? error.message
            : "Không thể tải chi tiết danh mục.",
        );
      }
    } finally {
      if (requestId === detailRequestId.current) {
        setIsLoadingDetail(false);
      }
    }
  }

  async function handleUpdateCategory(
    id: string,
    request: UpdateCatalogCategoryRequest,
  ) {
    setIsUpdatingCategory(true);

    try {
      const updatedCategory = await updateCategory(id, request);

      if (!updatedCategory.success) {
        toast.error(updatedCategory.error.message);
        return;
      }

      setCategoryDetail(updatedCategory.data);
      setSelectedCategory(updatedCategory.data);
      toast.success("Đã cập nhật danh mục.");
      detailRefresh?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật danh mục.",
      );
    } finally {
      setIsUpdatingCategory(false);
    }
  }

  function closeCategoryDetail() {
    ++detailRequestId.current;
    setSelectedCategory(null);
    setCategoryDetail(null);
    setDetailError(null);
    setIsLoadingDetail(false);
  }

  function refreshCategoryDetail() {
    if (selectedCategory) {
      void handleViewCategory(selectedCategory, detailRefresh ?? undefined);
    }
  }

  return {
    categoryDetail,
    closeCategoryDetail,
    detailError,
    handleCreateCategory,
    handleOpenCreateCategory,
    handleUpdateCategory,
    handleViewCategory,
    isCreateDrawerOpen,
    isCreatingCategory,
    isLoadingDetail,
    isUpdatingCategory,
    refreshCategoryDetail,
    selectedCategory,
    setIsCreateDrawerOpen,
  };
}
