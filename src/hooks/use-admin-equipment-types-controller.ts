"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import type {
  EquipmentTypePendingAction,
  EquipmentTypeRefreshHandler,
} from "@/components/admin/catalog/equipment-types/equipment-type-management-types";
import type {
  CatalogEquipmentTypeDetail,
  CatalogEquipmentTypeListItem,
  CreateCatalogEquipmentTypeRequest,
  UpdateCatalogEquipmentTypeRequest,
} from "@/types/catalog";

type UseAdminEquipmentTypesControllerParams = {
  createEquipmentType: (
    request: CreateCatalogEquipmentTypeRequest,
  ) => Promise<CatalogEquipmentTypeDetail>;
  fetchEquipmentTypeDetail: (id: string) => Promise<CatalogEquipmentTypeDetail>;
  updateEquipmentType: (
    id: string,
    request: UpdateCatalogEquipmentTypeRequest,
  ) => Promise<CatalogEquipmentTypeDetail>;
};

export function useAdminEquipmentTypesController({
  createEquipmentType,
  fetchEquipmentTypeDetail,
  updateEquipmentType,
}: UseAdminEquipmentTypesControllerParams) {
  const [selectedEquipmentType, setSelectedEquipmentType] =
    useState<CatalogEquipmentTypeListItem | null>(null);
  const [equipmentTypeDetail, setEquipmentTypeDetail] =
    useState<CatalogEquipmentTypeDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [createRefresh, setCreateRefresh] =
    useState<EquipmentTypeRefreshHandler | null>(null);
  const [detailRefresh, setDetailRefresh] =
    useState<EquipmentTypeRefreshHandler | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isCreatingEquipmentType, setIsCreatingEquipmentType] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingEquipmentType, setIsUpdatingEquipmentType] = useState(false);
  const [pendingAction, setPendingAction] =
    useState<EquipmentTypePendingAction>(null);
  const detailRequestId = useRef(0);

  function handleOpenCreateEquipmentType(refresh: EquipmentTypeRefreshHandler) {
    setCreateRefresh(() => refresh);
    setIsCreateDrawerOpen(true);
  }

  async function handleCreateEquipmentType(
    request: CreateCatalogEquipmentTypeRequest,
  ) {
    setIsCreatingEquipmentType(true);

    try {
      await createEquipmentType(request);
      toast.success("Đã tạo loại thiết bị.");
      setIsCreateDrawerOpen(false);
      createRefresh?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tạo loại thiết bị.",
      );
    } finally {
      setIsCreatingEquipmentType(false);
    }
  }

  async function handleViewEquipmentType(
    equipmentType: CatalogEquipmentTypeListItem,
    refresh?: EquipmentTypeRefreshHandler,
  ) {
    const requestId = ++detailRequestId.current;

    setSelectedEquipmentType(equipmentType);
    setEquipmentTypeDetail(null);
    setDetailError(null);
    setDetailRefresh(() => refresh ?? null);
    setIsLoadingDetail(true);

    try {
      const nextEquipmentTypeDetail = await fetchEquipmentTypeDetail(
        equipmentType.id,
      );

      if (requestId === detailRequestId.current) {
        setEquipmentTypeDetail(nextEquipmentTypeDetail);
      }
    } catch (error) {
      if (requestId === detailRequestId.current) {
        setDetailError(
          error instanceof Error
            ? error.message
            : "Không thể tải chi tiết loại thiết bị.",
        );
      }
    } finally {
      if (requestId === detailRequestId.current) {
        setIsLoadingDetail(false);
      }
    }
  }

  async function handleUpdateEquipmentType(
    id: string,
    request: UpdateCatalogEquipmentTypeRequest,
  ) {
    setIsUpdatingEquipmentType(true);

    try {
      const updatedEquipmentType = await updateEquipmentType(id, request);

      setEquipmentTypeDetail(updatedEquipmentType);
      setSelectedEquipmentType(updatedEquipmentType);
      toast.success("Đã cập nhật loại thiết bị.");
      detailRefresh?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật loại thiết bị.",
      );
    } finally {
      setIsUpdatingEquipmentType(false);
    }
  }

  function closeEquipmentTypeDetail() {
    ++detailRequestId.current;
    setSelectedEquipmentType(null);
    setEquipmentTypeDetail(null);
    setDetailError(null);
    setIsLoadingDetail(false);
  }

  function refreshEquipmentTypeDetail() {
    if (selectedEquipmentType) {
      void handleViewEquipmentType(
        selectedEquipmentType,
        detailRefresh ?? undefined,
      );
    }
  }

  return {
    closeEquipmentTypeDetail,
    detailError,
    equipmentTypeDetail,
    handleCreateEquipmentType,
    handleOpenCreateEquipmentType,
    handleUpdateEquipmentType,
    handleViewEquipmentType,
    isCreateDrawerOpen,
    isCreatingEquipmentType,
    isLoadingDetail,
    isUpdatingEquipmentType,
    pendingAction,
    refreshEquipmentTypeDetail,
    selectedEquipmentType,
    setIsCreateDrawerOpen,
    setPendingAction,
  };
}
