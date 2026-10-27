"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useOwnProductsController } from "@/hooks/use-own-products-controller";
import { useCatalogSelectOptions } from "@/hooks/use-catalog-select-options";
import type { ApiResult } from "@/services/api-error";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import type {
  CatalogBrand,
  CatalogEquipmentTypeListItem,
} from "@/types/catalog";
import {
  EQUIPMENT_LISTING_STATUS,
  type EquipmentListing,
  type EquipmentListingFilters,
  type EquipmentListingRentalRate,
  type UpdateEquipmentListingRequest,
} from "@/types/inventory";
import {
  formatEquipmentListingDate,
  getEquipmentListingName,
  getEquipmentListingStatusLabel,
} from "@/utils/inventory";

import { productColumns } from "./product-table-columns";
import {
  ProductCreateDrawer,
  CatalogOptionsState,
} from "./product-create-drawer";
import { ProductEditDrawer } from "./product-detail-drawer";
import type {
  ProductCreateActions,
  ProductDetailActions,
} from "./product-management-types";
type ProductsManagementTableProps = {
  createActions: ProductCreateActions;
  detailActions: ProductDetailActions;
  fetchProducts: (
    params: DataTableFetchParams<EquipmentListingFilters>,
  ) => Promise<ApiResult<DataTableFetchResult<EquipmentListing>>>;
  initialBrands?: CatalogBrand[];
  initialEquipmentTypes?: CatalogEquipmentTypeListItem[];
};

export function ProductsManagementTable({
  createActions,
  detailActions,
  fetchProducts,
  initialBrands,
  initialEquipmentTypes,
}: ProductsManagementTableProps) {
  const {
    isCreateDrawerOpen,
    isCreatingProduct,
    setIsCreateDrawerOpen,
    handleOpenCreateProduct,
    handleCreateProduct,
  } = useOwnProductsController(createActions.create);
  const equipmentTypes = useCatalogSelectOptions(
    createActions.fetchEquipmentTypes,
    true,
    initialEquipmentTypes,
  );
  const brands = useCatalogSelectOptions(
    createActions.fetchBrands,
    true,
    initialBrands,
  );
  const [editingProduct, setEditingProduct] = useState<EquipmentListing | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const submittingRef = useRef(false);
  const tableRefreshRef = useRef<(() => void) | null>(null);

  async function save<T>(
    operation: () => Promise<ApiResult<T>>,
    apply: (result: T) => void,
    message: string,
  ) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSaving(true);
    try {
      const result = await operation();
      if (result.success) {
        apply(result.data);
        toast.success(message);
      } else toast.error(result.error.message);
      return result;
    } finally {
      submittingRef.current = false;
      setIsSaving(false);
    }
  }

  async function updateInformation(request: UpdateEquipmentListingRequest) {
    if (!editingProduct) return;
    return save(
      () => detailActions.updateInformation(editingProduct.id, request),
      (updated) => {
        setEditingProduct(updated);
        tableRefreshRef.current?.();
      },
      request.specValues
        ? "Đã cập nhật thông số kỹ thuật."
        : "Đã cập nhật thông tin sản phẩm.",
    );
  }

  async function updateRate(request: EquipmentListingRentalRate) {
    if (!editingProduct) return;
    return save(
      () => detailActions.updateRentalRate(editingProduct.id, request),
      (rate) => {
        setEditingProduct((current) =>
          current ? { ...current, rentalRate: rate } : current,
        );
        tableRefreshRef.current?.();
      },
      "Đã cập nhật giá thuê.",
    );
  }
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <DataTable<EquipmentListing, EquipmentListingFilters>
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={productColumns}
        csvColumns={[
          { header: "Tên sản phẩm", value: (product) => product.name ?? "" },
          { header: "Mô tả", value: (product) => product.description ?? "" },
          { header: "Model", value: "model" },
          {
            header: "Trạng thái",
            value: (product) => getEquipmentListingStatusLabel(product.status),
          },
          { header: "Số lượng", value: "totalQuantity" },
          {
            header: "Giá thuê / ngày",
            value: (product) => product.rentalRate?.dailyRate ?? "",
          },
          {
            header: "Giá thuê / tuần",
            value: (product) => product.rentalRate?.weeklyRate ?? "",
          },
          {
            header: "Giá thuê / tháng",
            value: (product) => product.rentalRate?.monthlyRate ?? "",
          },
          {
            header: "Tiền tệ",
            value: (product) => product.rentalRate?.currency ?? "",
          },
          {
            header: "Ngày tạo",
            value: (product) => formatEquipmentListingDate(product.createdAt),
          },
          {
            header: "Cập nhật",
            value: (product) => formatEquipmentListingDate(product.updatedAt),
          },
        ]}
        csvFilename="danh-sach-san-pham.csv"
        description="Quản lý danh sách thiết bị cho thuê của bạn"
        emptyState="Bạn chưa có sản phẩm nào."
        fetchData={fetchProducts}
        getRowId={(product) => product.id}
        initialPageSize={20}
        initialFilterParams={{}}
        onRowDoubleClick={(product) => {
          setEditingProduct(product);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        renderFilters={({ filters, setFilters }) => (
          <>
            <select
              aria-label="Lọc trạng thái sản phẩm"
              className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary sm:w-48"
              onChange={(event) =>
                setFilters({
                  ...filters,
                  status: event.target.value
                    ? (Number(
                        event.target.value,
                      ) as EquipmentListingFilters["status"])
                    : undefined,
                })
              }
              value={filters.status ?? ""}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.values(EQUIPMENT_LISTING_STATUS).map((status) => (
                <option key={status} value={status}>
                  {getEquipmentListingStatusLabel(status)}
                </option>
              ))}
            </select>
            <div className="w-full space-y-1 sm:w-52">
              <select
                aria-label="Lọc loại thiết bị"
                className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
                disabled={equipmentTypes.isLoading}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    equipmentTypeId: event.target.value || undefined,
                  })
                }
                value={filters.equipmentTypeId ?? ""}
              >
                <option value="">Tất cả loại thiết bị</option>
                {equipmentTypes.items.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <CatalogOptionsState
                {...equipmentTypes}
                label="loại thiết bị"
                showLoadingMessage={false}
                disabled={false}
              />
            </div>
            <div className="w-full space-y-1 sm:w-48">
              <select
                aria-label="Lọc thương hiệu"
                className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
                disabled={brands.isLoading}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    brandId: event.target.value || undefined,
                  })
                }
                value={filters.brandId ?? ""}
              >
                <option value="">Tất cả thương hiệu</option>
                {brands.items.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <CatalogOptionsState
                {...brands}
                label="thương hiệu"
                showLoadingMessage={false}
                disabled={false}
              />
            </div>
          </>
        )}
        renderRowActions={(product) => (
          <Button
            aria-label="Sửa thông tin sản phẩm"
            onClick={() => {
              setEditingProduct(product);
            }}
            size="sm"
            title="Sửa thông tin sản phẩm"
            type="button"
            variant="default"
          >
            Chi tiết
          </Button>
        )}
        renderToolbarActions={({ refresh }) => {
          tableRefreshRef.current = refresh;
          return (
            <Button
              disabled={isCreatingProduct}
              onClick={() => handleOpenCreateProduct(refresh)}
              type="button"
            >
              <Plus className="size-4" />
              Thêm sản phẩm
            </Button>
          );
        }}
        searchDebounceMs={300}
        searchPlaceholder="Tìm sản phẩm…"
        title="Danh sách sản phẩm"
      />
      {isCreateDrawerOpen ? (
        <ProductCreateDrawer
          actions={createActions}
          brands={brands}
          equipmentTypes={equipmentTypes}
          isSubmitting={isCreatingProduct}
          onOpenChange={setIsCreateDrawerOpen}
          onSubmit={handleCreateProduct}
        />
      ) : null}
      {editingProduct ? (
        <ProductEditDrawer
          actions={detailActions}
          brandName={
            brands.items.find((b) => b.id === editingProduct.brandId)?.name
          }
          error={null}
          fetchBrands={createActions.fetchBrands}
          isLoading={false}
          isSubmitting={isSaving}
          onOpenChange={(open) => {
            if (!open) setEditingProduct(null);
          }}
          onRefresh={() => {
            tableRefreshRef.current?.();
          }}
          onUpdateInformation={updateInformation}
          onUpdateRentalRate={updateRate}
          product={editingProduct}
          selectedName={getEquipmentListingName(editingProduct)}
          typeName={
            equipmentTypes.items.find(
              (t) => t.id === editingProduct.equipmentTypeId,
            )?.name
          }
        />
      ) : null}
    </div>
  );
}
