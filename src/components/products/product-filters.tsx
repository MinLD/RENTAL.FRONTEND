"use client";

import { Filter } from "lucide-react";

import type { ProductBrowseData } from "@/types/product-browse";
import { ProductBrandPopover } from "./product-brand-popover";
import { ProductCategoryPopover } from "./product-category-popover";
import { ProductMobileFilters } from "./product-mobile-filters";
import { ProductResetFiltersButton } from "./product-reset-filters-button";

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
  return (
    <div
      aria-label="Bộ lọc thiết bị"
      className="sticky top-[var(--site-header-height,6rem)] z-30 -mx-4 bg-background/95 px-4 py-2.5 "
      role="group"
    >
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        <span className="mr-1 hidden shrink-0 items-center gap-1.5 text-xs font-bold text-foreground lg:inline-flex">
          <Filter aria-hidden="true" className="size-4 text-primary" />
          Bộ lọc
        </span>
        <ProductCategoryPopover
          categories={categories}
          equipmentTypes={equipmentTypes}
          filters={filters}
        />
        <ProductMobileFilters
          brands={brands}
          filters={filters}
          specificationFields={specificationFields}
        />
        <div className="hidden sm:block">
          <ProductBrandPopover brands={brands} filters={filters} />
        </div>
        <ProductResetFiltersButton
          className="ml-auto hidden h-9 shrink-0 whitespace-nowrap px-3 text-xs sm:inline-flex"
          size="sm"
          variant="secondary"
        />
      </div>
    </div>
  );
}
