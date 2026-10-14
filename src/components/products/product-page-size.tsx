"use client";

import { PRODUCT_PAGE_SIZES } from "@/config/product-browse";
import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import type { ProductBrowseFilters } from "@/types/product-browse";

export function ProductPageSize({
  filters,
}: {
  filters: ProductBrowseFilters;
}) {
  const { isPending, navigate } = useProductBrowseNavigation();
  return (
    <label>
      <span className="sr-only">Sản phẩm mỗi trang</span>
      <select
        aria-label="Sản phẩm mỗi trang"
        className="h-10 w-18 cursor-pointer rounded border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary disabled:opacity-60"
        disabled={isPending}
        onChange={(event) => navigate({ pageSize: Number(event.target.value) })}
        value={filters.pageSize}
      >
        {PRODUCT_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}
