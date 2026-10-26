"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Filter, SlidersHorizontal } from "lucide-react";
import { Popover } from "radix-ui";

import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import type { ProductBrowseData } from "@/types/product-browse";
import { ProductBrandPopover } from "./product-brand-popover";
import { ProductCategoryPopover } from "./product-category-popover";
import { ProductMobileFilters } from "./product-mobile-filters";
import { ProductResetFiltersButton } from "./product-reset-filters-button";
import { ProductSpecificationFilters } from "./product-specification-filters";

const filterButtonClass =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#eadfd8] bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[state=open]:border-primary data-[state=open]:text-primary";

function FilterPopover({
  active,
  children,
  clearable = false,
  icon,
  label,
}: {
  active: boolean;
  children: (close: () => void) => ReactNode;
  clearable?: boolean;
  icon: ReactNode;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const { isPending, resetFilters } = useProductBrowseNavigation();
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={`${filterButtonClass} ${active ? "border-primary bg-primary/5 text-primary" : ""}`}
          type="button"
        >
          {icon}
          {label}
          <ChevronDown aria-hidden="true" className="size-3.5" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="z-50 max-h-[min(70dvh,var(--radix-popover-content-available-height))] w-[min(320px,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-[#eadfd8] bg-background p-4 text-foreground shadow-xl outline-none"
          collisionPadding={12}
          sideOffset={8}
        >
          {children(() => setOpen(false))}
          {clearable ? (
            <div className="mt-3 border-t border-[#f0e8e2] pt-3">
              <button
                className="h-10 w-full cursor-pointer rounded-lg border border-[#eadfd8] text-sm font-semibold transition-colors hover:bg-[#fff4ed] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPending}
                onClick={() => {
                  resetFilters();
                  setOpen(false);
                }}
                type="button"
              >
                Xóa lọc
              </button>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

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
        {filters.equipmentTypeId ? (
          <div className="hidden sm:block">
            <FilterPopover
              active={Boolean(filters.filters)}
              icon={
                <SlidersHorizontal aria-hidden="true" className="size-3.5" />
              }
              label="Thông số kỹ thuật"
            >
              {(close) => (
                <ProductSpecificationFilters
                  key={JSON.stringify([
                    filters.equipmentTypeId,
                    filters.filters,
                    specificationFields,
                  ])}
                  filters={filters}
                  onApplied={close}
                  specificationFields={specificationFields}
                />
              )}
            </FilterPopover>
          </div>
        ) : null}
        <ProductResetFiltersButton
          className="ml-auto hidden h-9 shrink-0 whitespace-nowrap px-3 text-xs sm:inline-flex"
          size="sm"
          variant="secondary"
        />
      </div>
    </div>
  );
}
