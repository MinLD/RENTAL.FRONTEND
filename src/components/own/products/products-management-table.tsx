"use client";

import { DataTable } from "@/components/data-table";
import { useRouter } from "next/navigation";
import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOwnProductsController } from "@/hooks/use-own-products-controller";
import { useCatalogSelectOptions } from "@/hooks/use-catalog-select-options";
import type { ApiResult } from "@/services/api-error";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import {
  EQUIPMENT_LISTING_STATUS,
  type EquipmentListing,
  type EquipmentListingFilters,
} from "@/types/inventory";
import {
  formatEquipmentListingDate,
  getEquipmentListingStatusLabel,
} from "@/utils/inventory";

import { productColumns } from "./product-table-columns";
import {
  ProductCreateDrawer,
  CatalogOptionsState,
} from "./product-create-drawer";
import type { ProductCreateActions } from "./product-management-types";

type ProductsManagementTableProps = {
  createActions: ProductCreateActions;
  fetchProducts: (
    params: DataTableFetchParams<EquipmentListingFilters>,
  ) => Promise<ApiResult<DataTableFetchResult<EquipmentListing>>>;
};

export function ProductsManagementTable({
  createActions,
  fetchProducts,
}: ProductsManagementTableProps) {
  const {
    isCreateDrawerOpen,
    isCreatingProduct,
    setIsCreateDrawerOpen,
    handleOpenCreateProduct,
    handleCreateProduct,
  } = useOwnProductsController(createActions.create);
  const router = useRouter();
  const equipmentTypes = useCatalogSelectOptions(
    createActions.fetchEquipmentTypes,
  );
  const brands = useCatalogSelectOptions(createActions.fetchBrands);
  function handleViewProduct(product: EquipmentListing) {
    router.push(`/own/products/${encodeURIComponent(product.id)}`);
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
          void handleViewProduct(product);
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
            aria-label="Xem chi tiết sản phẩm"
            onClick={() => {
              void handleViewProduct(product);
            }}
            size="icon"
            title="Xem chi tiết sản phẩm"
            type="button"
            variant="default"
          >
            <Eye className="size-4" />
          </Button>
        )}
        renderToolbarActions={({ refresh }) => (
          <Button
            disabled={isCreatingProduct}
            onClick={() => handleOpenCreateProduct(refresh)}
            type="button"
          >
            <Plus className="size-4" />
            Thêm sản phẩm
          </Button>
        )}
        searchDebounceMs={300}
        searchPlaceholder="Tìm sản phẩm…"
        title="Danh sách sản phẩm"
      />
      {isCreateDrawerOpen ? (
        <ProductCreateDrawer
          actions={createActions}
          isSubmitting={isCreatingProduct}
          onOpenChange={setIsCreateDrawerOpen}
          onSubmit={handleCreateProduct}
        />
      ) : null}
    </div>
  );
}
