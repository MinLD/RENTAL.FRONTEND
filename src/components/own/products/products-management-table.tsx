"use client";

import { DataTable } from "@/components/data-table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOwnProductsController } from "@/hooks/use-own-products-controller";
import type { ApiResult } from "@/services/api-error";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import type { EquipmentListing } from "@/types/inventory";
import {
  formatEquipmentListingDate,
  getEquipmentListingStatusLabel,
} from "@/utils/inventory";

import { productColumns } from "./product-table-columns";
import { ProductCreateDrawer } from "./product-create-drawer";
import type { ProductCreateActions } from "./product-management-types";

type ProductsManagementTableProps = {
  createActions: ProductCreateActions;
  fetchProducts: (
    params: DataTableFetchParams,
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
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <DataTable<EquipmentListing>
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={productColumns}
        csvColumns={[
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
        pageSizeOptions={[10, 20, 50, 100]}
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
        searchDebounceMs={0}
        showSearch={false}
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
