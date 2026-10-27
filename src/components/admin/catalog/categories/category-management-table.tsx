"use client";

import { Plus } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useAdminCategoriesController } from "@/hooks/use-admin-categories-controller";
import type {
  AdminCatalogCategoryFilterParams,
  CatalogCategoryDetail,
} from "@/types/catalog";

import {
  CategoryCreateDrawer,
  CategoryDetailDrawer,
} from "./category-form-drawer";
import type { CategoryManagementTableProps } from "./category-management-types";
import { categoryColumns } from "./category-table-columns";

const CATEGORY_SORT_OPTIONS = [
  { label: "Mặc định", value: "" },
  { label: "Tên A-Z", value: "name_asc" },
  { label: "Tên Z-A", value: "name_desc" },
] as const;

export function CategoryManagementTable({
  createCategory,
  fetchCategories,
  fetchCategoryDetail,
  updateCategory,
}: CategoryManagementTableProps) {
  const {
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
  } = useAdminCategoriesController({
    createCategory,
    fetchCategoryDetail,
    updateCategory,
  });

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <DataTable<CatalogCategoryDetail, AdminCatalogCategoryFilterParams>
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={categoryColumns}
        csvColumns={[
          { header: "ID", value: "id" },
          { header: "Tên", value: "name" },
          { header: "Slug", value: (category) => category.slug ?? "" },
          {
            header: "Trạng thái",
            value: (category) =>
              category.isActive ? "Active" : "Inactive",
          },
          {
            header: "Mô tả",
            value: (category) => category.description ?? "",
          },
        ]}
        csvFilename="danh-sach-danh-muc.csv"
        description="Quản lý danh mục thiết bị"
        emptyState="Không có danh mục phù hợp."
        fetchData={fetchCategories}
        getRowId={(category) => category.id}
        initialFilterParams={{}}
        initialPageSize={20}
        onRowDoubleClick={(category) => {
          void handleViewCategory(category);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        renderFilters={({ filters, setFilters }) => (
          <>
            <select
              aria-label="Lọc trạng thái danh mục"
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
              aria-label="Sắp xếp danh mục"
              className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-44"
              onChange={(event) => {
                setFilters({
                  ...filters,
                  sort:
                    (event.target
                      .value as AdminCatalogCategoryFilterParams["sort"]) ||
                    undefined,
                });
              }}
              value={filters.sort ?? ""}
            >
              {CATEGORY_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        )}
        renderRowActions={(category, { refresh }) => (
          <div className="flex justify-end gap-1">
            <Button
              aria-label="Xem chi tiết danh mục"
              disabled={isLoadingDetail}
              onClick={() => {
                void handleViewCategory(category, refresh);
              }}
              size="sm"
              title="Xem chi tiết danh mục"
              type="button"
              variant="default"
            >
              Chi tiết
            </Button>
          </div>
        )}
        renderToolbarActions={({ refresh }) => (
          <Button
            disabled={isCreatingCategory}
            onClick={() => {
              handleOpenCreateCategory(refresh);
            }}
            type="button"
          >
            <Plus className="size-4" />
            Thêm danh mục
          </Button>
        )}
        searchPlaceholder="Tìm theo tên, slug hoặc mô tả..."
        title="Danh sách danh mục"
      />

      <CategoryCreateDrawer
        isSubmitting={isCreatingCategory}
        onOpenChange={setIsCreateDrawerOpen}
        onSubmit={handleCreateCategory}
        open={isCreateDrawerOpen}
      />
      <CategoryDetailDrawer
        category={categoryDetail}
        error={detailError}
        isLoading={isLoadingDetail}
        isSubmitting={isUpdatingCategory}
        onOpenChange={(open) => !open && closeCategoryDetail()}
        onRefresh={refreshCategoryDetail}
        onSubmit={handleUpdateCategory}
        open={Boolean(selectedCategory)}
        selectedName={selectedCategory?.name}
      />
    </div>
  );
}
