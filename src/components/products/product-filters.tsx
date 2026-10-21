"use client";

import { useState } from "react";
import { Filter } from "lucide-react";

import { ProductFilterSection } from "./product-filter-section";
import { ProductRentalFilters } from "./product-rental-filters";
import { ProductResetFiltersButton } from "./product-reset-filters-button";
import { ProductSpecificationFilters } from "./product-specification-filters";
import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import type { ProductBrowseData } from "@/types/product-browse";
import { hasCatalogListings } from "@/utils/catalog";

export function ProductFilters({
  filters,
  categories,
  equipmentTypes,
  brands,
  specificationFields,
}: Pick<
  ProductBrowseData,
  "filters" | "categories" | "equipmentTypes" | "brands" | "specificationFields"
>) {
  const { isPending, navigate } = useProductBrowseNavigation();
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <aside
      aria-busy={isPending}
      aria-labelledby="product-filter-title"
      className="min-w-0 self-start rounded border border-border bg-background"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
        <h2
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase"
          id="product-filter-title"
        >
          <Filter aria-hidden="true" className="size-3.5 text-primary" />
          Bộ lọc tìm kiếm
        </h2>
        <ProductResetFiltersButton
          className="hidden h-auto p-0 text-[10px] font-normal uppercase text-muted-foreground hover:text-primary lg:inline-flex"
          variant="default"
        />
        <button
          aria-controls="product-filter-controls"
          aria-expanded={isExpanded}
          className="cursor-pointer text-xs font-semibold text-primary lg:hidden"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          {isExpanded ? "Thu gọn" : "Mở bộ lọc"}
        </button>
      </div>
      <div
        className={`${isExpanded ? "block" : "hidden"} space-y-5 px-3 py-3.5 lg:block`}
        id="product-filter-controls"
      >
        <section aria-labelledby="product-category-filter-title" className="space-y-4">
          <h3 className="text-[11px] font-bold uppercase" id="product-category-filter-title">
            Danh mục thiết bị
          </h3>
          <ProductFilterSection
            allLabel="Tất cả danh mục"
            defaultExpanded
            disabled={isPending}
            emptyMessage="Chưa có danh mục thiết bị."
            errorMessage="Không thể tải danh mục."
            name="categoryId"
            onChange={(categoryId) =>
              navigate({ categoryId, equipmentTypeId: undefined, filters: undefined })
            }
            options={categories.success ? categories.data.data.filter(hasCatalogListings) : null}
            placeholder="Tìm danh mục..."
            title="1. Danh mục"
            value={filters.categoryId}
          />

          {filters.categoryId ? (
            <div className="ml-2 space-y-4 border-l-2 border-primary/20 pl-3">
              <ProductFilterSection
                allLabel="Tất cả loại thiết bị"
                defaultExpanded
                disabled={isPending}
                emptyMessage="Danh mục chưa có loại thiết bị."
                errorMessage="Không thể tải loại thiết bị."
                key={filters.categoryId}
                name="equipmentTypeId"
                onChange={(equipmentTypeId) => navigate({ equipmentTypeId, filters: undefined })}
                options={equipmentTypes.success ? equipmentTypes.data.data.filter(hasCatalogListings) : null}
                placeholder="Tìm loại thiết bị..."
                title="2. Loại thiết bị"
                value={filters.equipmentTypeId}
              />

              {filters.equipmentTypeId ? (
                <div className="ml-2 border-l-2 border-border pl-3">
                  <ProductSpecificationFilters
                    key={JSON.stringify([filters.equipmentTypeId, filters.filters, specificationFields])}
                    filters={filters}
                    specificationFields={specificationFields}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <div className="border-t border-border pt-4">
          <ProductFilterSection
            allLabel="Tất cả thương hiệu"
            disabled={isPending}
            emptyMessage="Chưa có thương hiệu."
            errorMessage="Không thể tải thương hiệu."
            name="brandId"
            onChange={(brandId) => navigate({ brandId })}
            options={brands.success ? brands.data.data.filter(hasCatalogListings) : null}
            placeholder="Tìm thương hiệu..."
            title="Thương hiệu"
            value={filters.brandId}
          />
        </div>

        <ProductRentalFilters
          key={JSON.stringify([filters.from, filters.to, filters.requestedQuantity])}
          filters={filters}
        />
      </div>
    </aside>
  );
}
