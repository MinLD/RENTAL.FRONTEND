"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import type { ApiResult } from "@/services/api-error";
import type {
  BrandPendingAction,
  BrandRefreshHandler,
} from "@/components/admin/catalog/brands/brand-management-types";
import type {
  CatalogBrand,
  CreateCatalogBrandRequest,
  UpdateCatalogBrandRequest,
} from "@/types/catalog";

type UseAdminBrandsControllerParams = {
  createBrand: (
    request: CreateCatalogBrandRequest,
  ) => Promise<ApiResult<CatalogBrand>>;
  fetchBrandDetail: (id: string) => Promise<ApiResult<CatalogBrand>>;
  updateBrand: (
    id: string,
    request: UpdateCatalogBrandRequest,
  ) => Promise<ApiResult<CatalogBrand>>;
};

export function useAdminBrandsController({
  createBrand,
  fetchBrandDetail,
  updateBrand,
}: UseAdminBrandsControllerParams) {
  const [selectedBrand, setSelectedBrand] = useState<CatalogBrand | null>(null);
  const [brandDetail, setBrandDetail] = useState<CatalogBrand | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [createRefresh, setCreateRefresh] =
    useState<BrandRefreshHandler | null>(null);
  const [detailRefresh, setDetailRefresh] =
    useState<BrandRefreshHandler | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingBrand, setIsUpdatingBrand] = useState(false);
  const [pendingAction, setPendingAction] = useState<BrandPendingAction>(null);
  const detailRequestId = useRef(0);

  function handleOpenCreateBrand(refresh: BrandRefreshHandler) {
    setCreateRefresh(() => refresh);
    setIsCreateDrawerOpen(true);
  }

  async function handleCreateBrand(request: CreateCatalogBrandRequest) {
    setIsCreatingBrand(true);

    try {
      const result = await createBrand(request);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Đã tạo thương hiệu.");
      setIsCreateDrawerOpen(false);
      createRefresh?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo thương hiệu.",
      );
    } finally {
      setIsCreatingBrand(false);
    }
  }

  async function handleViewBrand(
    brand: CatalogBrand,
    refresh?: BrandRefreshHandler,
  ) {
    const requestId = ++detailRequestId.current;
    setSelectedBrand(brand);
    setBrandDetail(null);
    setDetailError(null);
    setDetailRefresh(() => refresh ?? null);
    setIsLoadingDetail(true);

    try {
      const nextBrandDetail = await fetchBrandDetail(brand.id);

      if (requestId === detailRequestId.current) {
        if (!nextBrandDetail.success) {
          setDetailError(nextBrandDetail.error.message);
          return;
        }
        setBrandDetail(nextBrandDetail.data);
      }
    } catch (error) {
      if (requestId === detailRequestId.current) {
        setDetailError(
          error instanceof Error
            ? error.message
            : "Không thể tải chi tiết thương hiệu.",
        );
      }
    } finally {
      if (requestId === detailRequestId.current) {
        setIsLoadingDetail(false);
      }
    }
  }

  async function handleUpdateBrand(
    id: string,
    request: UpdateCatalogBrandRequest,
  ) {
    setIsUpdatingBrand(true);

    try {
      const updatedBrand = await updateBrand(id, request);

      if (!updatedBrand.success) {
        toast.error(updatedBrand.error.message);
        return;
      }

      setBrandDetail(updatedBrand.data);
      setSelectedBrand(updatedBrand.data);
      toast.success("Đã cập nhật thương hiệu.");
      detailRefresh?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật thương hiệu.",
      );
    } finally {
      setIsUpdatingBrand(false);
    }
  }

  function closeBrandDetail() {
    ++detailRequestId.current;
    setSelectedBrand(null);
    setBrandDetail(null);
    setDetailError(null);
    setIsLoadingDetail(false);
  }

  function refreshBrandDetail() {
    if (selectedBrand) {
      void handleViewBrand(selectedBrand, detailRefresh ?? undefined);
    }
  }

  return {
    brandDetail,
    closeBrandDetail,
    detailError,
    handleCreateBrand,
    handleOpenCreateBrand,
    handleUpdateBrand,
    handleViewBrand,
    isCreateDrawerOpen,
    isCreatingBrand,
    isLoadingDetail,
    isUpdatingBrand,
    pendingAction,
    refreshBrandDetail,
    selectedBrand,
    setIsCreateDrawerOpen,
    setPendingAction,
  };
}
