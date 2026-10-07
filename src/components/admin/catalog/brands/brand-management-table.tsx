"use client";

import { useState } from "react";
import { Eye, Plus, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAdminBrandsController } from "@/hooks/use-admin-brands-controller";
import { useActionResult } from "@/hooks/use-action-result";
import type { ServerActionProps } from "@/types/action-result";
import type {
  AdminCatalogBrandFilterParams,
  CatalogBrand,
} from "@/types/catalog";

import {
  BrandCreateDrawer,
  BrandDetailDrawer,
} from "./brand-form-drawer";
import type { BrandManagementTableProps } from "./brand-management-types";
import { brandColumns } from "./brand-table-columns";

const BRAND_SORT_OPTIONS = [
  { label: "Mặc định", value: "" },
  { label: "Mới nhất", value: "newest" },
  { label: "Tên A-Z", value: "name_asc" },
  { label: "Tên Z-A", value: "name_desc" },
] as const;

export function BrandManagementTable(
  props: ServerActionProps<BrandManagementTableProps>,
) {
  const createBrand = useActionResult(props.createBrand);
  const disableBrand = useActionResult(props.disableBrand);
  const enableBrand = useActionResult(props.enableBrand);
  const fetchBrandDetail = useActionResult(props.fetchBrandDetail);
  const fetchBrands = useActionResult(props.fetchBrands);
  const updateBrand = useActionResult(props.updateBrand);

  return (
    <BrandManagementTableContent
      createBrand={createBrand}
      disableBrand={disableBrand}
      enableBrand={enableBrand}
      fetchBrandDetail={fetchBrandDetail}
      fetchBrands={fetchBrands}
      updateBrand={updateBrand}
    />
  );
}

function BrandManagementTableContent({
  createBrand,
  disableBrand,
  enableBrand,
  fetchBrandDetail,
  fetchBrands,
  updateBrand,
}: BrandManagementTableProps) {
  const [isTogglingBrand, setIsTogglingBrand] = useState(false);
  const {
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
  } = useAdminBrandsController({
    createBrand,
    fetchBrandDetail,
    updateBrand,
  });
  const isDisableAction = pendingAction?.action === "disable";

  async function handleConfirmBrandStatusChange() {
    if (!pendingAction) {
      return;
    }

    setIsTogglingBrand(true);

    try {
      if (pendingAction.action === "disable") {
        await disableBrand(pendingAction.brand.id);
      } else {
        await enableBrand(pendingAction.brand.id);
      }

      toast.success("Thao tác thành công.");
      pendingAction.refresh();
      setPendingAction(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể thực hiện thao tác.",
      );
    } finally {
      setIsTogglingBrand(false);
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <DataTable<CatalogBrand, AdminCatalogBrandFilterParams>
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={brandColumns}
        csvColumns={[
          { header: "ID", value: "id" },
          { header: "Code", value: "code" },
          { header: "Tên", value: "name" },
          { header: "Slug", value: (brand) => brand.slug ?? "" },
          {
            header: "Trạng thái",
            value: (brand) => (brand.isActive ? "Active" : "Inactive"),
          },
          { header: "Ngày tạo", value: (brand) => brand.createdAt ?? "" },
          { header: "Ngày cập nhật", value: (brand) => brand.updatedAt ?? "" },
        ]}
        csvFilename="danh-sach-thuong-hieu.csv"
        description="Quản lý thương hiệu thiết bị"
        emptyState="Không có thương hiệu phù hợp."
        fetchData={fetchBrands}
        getRowId={(brand) => brand.id}
        initialFilterParams={{}}
        initialPageSize={20}
        onRowDoubleClick={(brand) => {
          void handleViewBrand(brand);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        renderFilters={({ filters, setFilters }) => (
          <>
            <select
              aria-label="Lọc trạng thái thương hiệu"
              className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-48"
              onChange={(event) => {
                setFilters({
                  ...filters,
                  isActive:
                    event.target.value === ""
                      ? undefined
                      : event.target.value === "true",
                });
              }}
              value={
                filters.isActive === undefined ? "" : String(filters.isActive)
              }
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Ngừng hoạt động</option>
            </select>
            <select
              aria-label="Sắp xếp thương hiệu"
              className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-44"
              onChange={(event) => {
                setFilters({
                  ...filters,
                  sort:
                    (event.target.value as AdminCatalogBrandFilterParams["sort"]) ||
                    undefined,
                });
              }}
              value={filters.sort ?? ""}
            >
              {BRAND_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        )}
        renderRowActions={(brand, { refresh }) => (
          <div className="flex justify-end gap-1">
            <Button
              aria-label="Xem chi tiết thương hiệu"
              disabled={isLoadingDetail}
              onClick={() => {
                void handleViewBrand(brand, refresh);
              }}
              size="icon"
              title="Xem chi tiết thương hiệu"
              type="button"
              variant="default"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              aria-label={
                brand.isActive
                  ? "Vô hiệu hóa thương hiệu"
                  : "Kích hoạt thương hiệu"
              }
              onClick={() =>
                setPendingAction({
                  action: brand.isActive ? "disable" : "enable",
                  brand,
                  refresh,
                })
              }
              size="icon"
              title={
                brand.isActive
                  ? "Vô hiệu hóa thương hiệu"
                  : "Kích hoạt thương hiệu"
              }
              type="button"
              variant="default"
            >
              {brand.isActive ? (
                <PowerOff className="size-4" />
              ) : (
                <Power className="size-4" />
              )}
            </Button>
          </div>
        )}
        renderToolbarActions={({ refresh }) => (
          <Button
            disabled={isCreatingBrand}
            onClick={() => {
              handleOpenCreateBrand(refresh);
            }}
            type="button"
          >
            <Plus className="size-4" />
            Thêm thương hiệu
          </Button>
        )}
        searchPlaceholder="Tìm theo tên, code hoặc slug..."
        title="Danh sách thương hiệu"
      />

      <BrandCreateDrawer
        isSubmitting={isCreatingBrand}
        onOpenChange={setIsCreateDrawerOpen}
        onSubmit={handleCreateBrand}
        open={isCreateDrawerOpen}
      />
      <BrandDetailDrawer
        brand={brandDetail}
        error={detailError}
        isLoading={isLoadingDetail}
        isSubmitting={isUpdatingBrand}
        onOpenChange={(open) => !open && closeBrandDetail()}
        onRefresh={refreshBrandDetail}
        onSubmit={handleUpdateBrand}
        open={Boolean(selectedBrand)}
        selectedName={selectedBrand?.name}
      />

      <ConfirmDialog
        confirmLabel={isDisableAction ? "Vô hiệu hóa" : "Kích hoạt"}
        description={
          isDisableAction
            ? `Thương hiệu "${pendingAction?.brand.name || "này"}" sẽ không còn xuất hiện trong public catalog sau khi vô hiệu hóa.`
            : `Thương hiệu "${pendingAction?.brand.name || "này"}" sẽ được kích hoạt lại.`
        }
        icon={
          isDisableAction ? (
            <PowerOff className="size-5" />
          ) : (
            <Power className="size-5 text-green-600" />
          )
        }
        isSubmitting={isTogglingBrand}
        onConfirm={() => {
          void handleConfirmBrandStatusChange();
        }}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        open={Boolean(pendingAction)}
        submittingLabel="Đang xử lý..."
        title={
          isDisableAction
            ? "Vô hiệu hóa thương hiệu?"
            : "Kích hoạt thương hiệu?"
        }
        variant={isDisableAction ? "danger" : "primary"}
      />
    </div>
  );
}
