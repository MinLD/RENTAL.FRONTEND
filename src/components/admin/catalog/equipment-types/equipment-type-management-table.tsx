"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, LockKeyhole, Plus, UnlockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAdminEquipmentTypesController } from "@/hooks/use-admin-equipment-types-controller";
import { getCatalogEquipmentTypeStatusLabel } from "@/utils/catalog";
import {
  CATALOG_EQUIPMENT_TYPE_STATUS,
  type AdminCatalogEquipmentTypeFilterParams,
  type CatalogCategoryDetail,
  type CatalogEquipmentTypeListItem,
} from "@/types/catalog";

import {
  EquipmentTypeCreateDrawer,
  EquipmentTypeDetailDrawer,
} from "./equipment-type-form-drawer";
import type { EquipmentTypeManagementTableProps } from "./equipment-type-management-types";
import { equipmentTypeColumns } from "./equipment-type-table-columns";

const EQUIPMENT_TYPE_SORT_OPTIONS = [
  { label: "Mặc định", value: "" },
  { label: "Mới nhất", value: "newest" },
  { label: "Tên A-Z", value: "name_asc" },
  { label: "Tên Z-A", value: "name_desc" },
] as const;

export function EquipmentTypeManagementTable({
  schemaActions,
  createEquipmentType,
  disableEquipmentType,
  fetchCategories,
  fetchEquipmentTypeDetail,
  fetchEquipmentTypes,
  publishEquipmentType,
  updateEquipmentType,
}: EquipmentTypeManagementTableProps) {
  const [categories, setCategories] = useState<CatalogCategoryDetail[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const listRefreshRef = useRef<(() => void) | null>(null);
  const {
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
  } = useAdminEquipmentTypesController({
    createEquipmentType,
    fetchEquipmentTypeDetail,
    updateEquipmentType,
  });
  const isPublishAction = pendingAction?.action === "publish";

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      setIsLoadingCategories(true);

      try {
        const nextCategories = await fetchCategories();

        if (isMounted) {
          if (!nextCategories.success) {
            toast.error(nextCategories.error.message);
            return;
          }
          setCategories(nextCategories.data);
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách danh mục.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [fetchCategories]);

  async function handleConfirmAction() {
    if (!pendingAction) {
      return;
    }

    setIsSubmittingAction(true);

    try {
      const result = pendingAction.action === "publish"
        ? await publishEquipmentType(pendingAction.equipmentType.id)
        : await disableEquipmentType(pendingAction.equipmentType.id);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Thao tác thành công.");
      pendingAction.refresh();
      setPendingAction(null);
      refreshEquipmentTypeDetail();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể thực hiện thao tác.",
      );
    } finally {
      setIsSubmittingAction(false);
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <DataTable<
        CatalogEquipmentTypeListItem,
        AdminCatalogEquipmentTypeFilterParams
      >
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={equipmentTypeColumns}
        csvColumns={[
          { header: "ID", value: "id" },
          { header: "Code", value: "code" },
          { header: "Tên", value: "name" },
          {
            header: "Danh mục",
            value: (equipmentType) =>
              equipmentType.categories
                .map((category) => category.name)
                .join(", "),
          },
          {
            header: "Schema version",
            value: (equipmentType) => equipmentType.currentSchemaVersion ?? "",
          },
        ]}
        csvFilename="danh-sach-loai-thiet-bi.csv"
        description="Quản lý canonical equipment type"
        emptyState="Không có loại thiết bị phù hợp."
        fetchData={fetchEquipmentTypes}
        fetchDependencies={[categories.length]}
        getRowId={(equipmentType) => equipmentType.id}
        initialFilterParams={{}}
        initialPageSize={20}
        onRowDoubleClick={(equipmentType) => {
          void handleViewEquipmentType(equipmentType);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        renderFilters={({ filters, refresh, setFilters }) => (
          <>
            <DataTableRefreshBridge
              onRefreshReady={(nextRefresh) => {
                listRefreshRef.current = nextRefresh;
              }}
              refresh={refresh}
            />
            <select
              aria-label="Lọc trạng thái loại thiết bị"
              className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-48"
              onChange={(event) => {
                setFilters({
                  ...filters,
                  status:
                    event.target.value === ""
                      ? undefined
                      : (Number(
                          event.target.value,
                        ) as AdminCatalogEquipmentTypeFilterParams["status"]),
                });
              }}
              value={filters.status === undefined ? "" : String(filters.status)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value={CATALOG_EQUIPMENT_TYPE_STATUS.Draft}>
                {getCatalogEquipmentTypeStatusLabel(
                  CATALOG_EQUIPMENT_TYPE_STATUS.Draft,
                )}
              </option>
              <option value={CATALOG_EQUIPMENT_TYPE_STATUS.Published}>
                {getCatalogEquipmentTypeStatusLabel(
                  CATALOG_EQUIPMENT_TYPE_STATUS.Published,
                )}
              </option>
              <option value={CATALOG_EQUIPMENT_TYPE_STATUS.Disabled}>
                {getCatalogEquipmentTypeStatusLabel(
                  CATALOG_EQUIPMENT_TYPE_STATUS.Disabled,
                )}
              </option>
            </select>
            <select
              aria-label="Lọc danh mục loại thiết bị"
              className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-56"
              disabled={isLoadingCategories}
              onChange={(event) => {
                setFilters({
                  ...filters,
                  categoryId: event.target.value || undefined,
                });
              }}
              value={filters.categoryId ?? ""}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Sắp xếp loại thiết bị"
              className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-44"
              onChange={(event) => {
                setFilters({
                  ...filters,
                  sort: event.target.value || undefined,
                });
              }}
              value={filters.sort ?? ""}
            >
              {EQUIPMENT_TYPE_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        )}
        renderRowActions={(equipmentType, { refresh }) => (
          <div className="flex justify-end gap-1">
            <Button
              aria-label="Xem chi tiết loại thiết bị"
              disabled={isLoadingDetail}
              onClick={() => {
                void handleViewEquipmentType(equipmentType, refresh);
              }}
              size="icon"
              title="Xem chi tiết loại thiết bị"
              type="button"
              variant="default"
            >
              <Eye className="size-4" />
            </Button>
            {equipmentType.status === CATALOG_EQUIPMENT_TYPE_STATUS.Draft ||
            equipmentType.status === CATALOG_EQUIPMENT_TYPE_STATUS.Disabled ? (
              <Button
                aria-label="Mở khóa loại thiết bị"
                onClick={() =>
                  setPendingAction({
                    action: "publish",
                    equipmentType,
                    refresh,
                  })
                }
                size="icon"
                title="Mở khóa loại thiết bị"
                type="button"
                variant="default"
              >
                <UnlockKeyhole className="size-4" />
              </Button>
            ) : null}
            {equipmentType.status ===
            CATALOG_EQUIPMENT_TYPE_STATUS.Published ? (
              <Button
                aria-label="Khóa loại thiết bị"
                onClick={() =>
                  setPendingAction({
                    action: "disable",
                    equipmentType,
                    refresh,
                  })
                }
                size="icon"
                title="Khóa loại thiết bị"
                type="button"
                variant="default"
              >
                <LockKeyhole className="size-4" />
              </Button>
            ) : null}
          </div>
        )}
        renderToolbarActions={({ refresh }) => (
          <Button
            disabled={isCreatingEquipmentType || isLoadingCategories}
            onClick={() => {
              handleOpenCreateEquipmentType(refresh);
            }}
            type="button"
          >
            <Plus className="size-4" />
            Thêm loại thiết bị
          </Button>
        )}
        searchPlaceholder="Tìm theo tên, code hoặc mô tả..."
        title="Danh sách loại thiết bị"
      />

      <EquipmentTypeCreateDrawer
        categories={categories}
        isSubmitting={isCreatingEquipmentType}
        onOpenChange={setIsCreateDrawerOpen}
        onSubmit={handleCreateEquipmentType}
        open={isCreateDrawerOpen}
      />
      <EquipmentTypeDetailDrawer
        schemaActions={schemaActions}
        onSchemaPublished={() => {
          listRefreshRef.current?.();
        }}
        categories={categories}
        equipmentType={equipmentTypeDetail}
        error={detailError}
        isLoading={isLoadingDetail}
        isSubmitting={isUpdatingEquipmentType}
        onOpenChange={(open) => !open && closeEquipmentTypeDetail()}
        onPublish={(equipmentType) => {
          setPendingAction({
            action: "publish",
            equipmentType,
            refresh: listRefreshRef.current ?? refreshEquipmentTypeDetail,
          });
        }}
        onRefresh={refreshEquipmentTypeDetail}
        onSubmit={handleUpdateEquipmentType}
        open={Boolean(selectedEquipmentType)}
        selectedName={selectedEquipmentType?.name}
      />
      <ConfirmDialog
        confirmLabel={isPublishAction ? "Mở khóa" : "Khóa"}
        description={
          isPublishAction
            ? `Loại thiết bị "${pendingAction?.equipmentType.name || "này"}" sẽ được mở khóa và công khai trong catalog.`
            : `Loại thiết bị "${pendingAction?.equipmentType.name || "này"}" sẽ bị khóa và ngừng hiển thị trong catalog công khai.`
        }
        icon={
          isPublishAction ? (
            <UnlockKeyhole className="size-5 text-green-600" />
          ) : (
            <LockKeyhole className="size-5" />
          )
        }
        isSubmitting={isSubmittingAction}
        onConfirm={() => {
          void handleConfirmAction();
        }}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        open={Boolean(pendingAction)}
        submittingLabel="Đang xử lý..."
        title={
          isPublishAction ? "Mở khóa loại thiết bị?" : "Khóa loại thiết bị?"
        }
        variant={isPublishAction ? "primary" : "danger"}
      />
    </div>
  );
}

function DataTableRefreshBridge({
  onRefreshReady,
  refresh,
}: {
  onRefreshReady: (refresh: () => void) => void;
  refresh: () => void;
}) {
  useEffect(() => {
    onRefreshReady(refresh);
  }, [onRefreshReady, refresh]);

  return null;
}
