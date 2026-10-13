"use client";

import Link from "next/link";
import { useState } from "react";
import { Filter } from "lucide-react";

import { ProductFilterSection } from "./product-filter-section";
import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import type { ProductBrowseData } from "@/types/product-browse";

export function ProductFilters({
  filters,
  categories,
  equipmentTypes,
  brands,
}: Pick<ProductBrowseData, "filters" | "categories" | "equipmentTypes" | "brands">) {
  const { isPending, navigate } = useProductBrowseNavigation();
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <aside
      aria-busy={isPending}
      aria-labelledby="product-filter-title"
      className="min-w-0 self-start rounded border border-border bg-background lg:sticky lg:top-4"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
        <h2
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase"
          id="product-filter-title"
        >
          <Filter aria-hidden="true" className="size-3.5 text-primary" />
          Bộ lọc tìm kiếm
        </h2>
        <Link
          className="hidden text-[10px] uppercase text-muted-foreground hover:text-primary lg:inline"
          href="/products"
          prefetch={false}
        >
          Xóa bộ lọc
        </Link>
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
          disabled={isPending}
          emptyMessage="Chưa có danh mục thiết bị."
          errorMessage="Không thể tải danh mục."
          name="categoryId"
          onChange={(categoryId) =>
            navigate({ categoryId, equipmentTypeId: undefined })
          }
          options={categories.success ? categories.data.data : null}
          placeholder="Tìm danh mục..."
          title="1. Danh mục thiết bị"
          value={filters.categoryId}
        />
        <ProductFilterSection
          allLabel={filters.categoryId ? undefined : "Tất cả loại thiết bị"}
          disabled={isPending}
          emptyMessage="Danh mục chưa có loại thiết bị."
          errorMessage="Không thể tải loại thiết bị."
          key={filters.categoryId ?? "all-types"}
          name="equipmentTypeId"
          onChange={(equipmentTypeId) => navigate({ equipmentTypeId })}
          options={equipmentTypes.success ? equipmentTypes.data.data : null}
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
          options={brands.success ? brands.data.data : null}
          placeholder="Tìm thương hiệu..."
          title="3. Thương hiệu"
          value={filters.brandId}
        />
      </div>
    </aside>
  );
}
