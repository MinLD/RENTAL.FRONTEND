"use client";

import { useState } from "react";
import { Filter } from "lucide-react";

import { ProductFilterSection } from "./product-filter-section";
import { ProductAdvancedFilters } from "./product-advanced-filters";
import { ProductResetFiltersButton } from "./product-reset-filters-button";
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
      className="min-w-0 self-start rounded border border-border bg-background lg:sticky lg:top-[calc(var(--site-header-height,8rem)+1rem)]"
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
          title="1. Danh mục thiết bị"
          value={filters.categoryId}
        />
        <ProductFilterSection
          allLabel="Tất cả loại thiết bị"
          disabled={isPending}
          emptyMessage="Danh mục chưa có loại thiết bị."
          errorMessage="Không thể tải loại thiết bị."
          key={filters.categoryId ?? "all-types"}
          name="equipmentTypeId"
          onChange={(equipmentTypeId) =>
            navigate({ equipmentTypeId, filters: undefined })
          }
          options={equipmentTypes.success ? equipmentTypes.data.data.filter(hasCatalogListings) : null}
          placeholder="Tìm loại thiết bị..."
          title="2. Loại thiết bị"
          value={filters.equipmentTypeId}
        />
        <ProductFilterSection
          allLabel="Tất cả thương hiệu"
          disabled={isPending}
          emptyMessage="Chưa có thương hiệu."
          errorMessage="Không thể tải thương hiệu."
          name="brandId"
          onChange={(brandId) => navigate({ brandId })}
          options={brands.success ? brands.data.data.filter(hasCatalogListings) : null}
          placeholder="Tìm thương hiệu..."
          title="3. Thương hiệu"
          value={filters.brandId}
        />
        <ProductAdvancedFilters
          key={JSON.stringify([filters.equipmentTypeId, filters.from, filters.to, filters.requestedQuantity, filters.filters, specificationFields])}
          filters={filters}
          specificationFields={specificationFields}
        />
      </div>
    </aside>
  );
}
