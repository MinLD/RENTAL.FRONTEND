"use client";

import { LayoutGrid, List } from "lucide-react";

import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import type { ProductBrowseFilters } from "@/types/product-browse";

export function ProductResultsToolbar({ filters }: { filters: ProductBrowseFilters }) {
  const { isPending, navigate } = useProductBrowseNavigation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border">
      <span className="inline-flex h-11 items-center border-b-2 border-primary px-2 text-sm font-semibold text-foreground">
        Tất cả
      </span>
      <div className="flex items-center gap-2 pb-1 sm:gap-3">
        <span className="px-2 text-xs font-medium text-foreground sm:text-sm">Tin mới nhất</span>
        <div aria-label="Kiểu hiển thị" className="flex items-center gap-0.5 rounded border border-border p-0.5" role="group">
          <button
            aria-label="Dạng lưới"
            aria-pressed={!filters.view}
            className={`flex size-8 cursor-pointer items-center justify-center rounded transition-colors focus-visible:outline-2 focus-visible:outline-primary ${!filters.view ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-[#fff4ed] hover:text-primary"}`}
            disabled={isPending}
            onClick={() => navigate({ view: undefined, page: filters.page })}
            title="Dạng lưới"
            type="button"
          >
            <LayoutGrid aria-hidden="true" className="size-4" />
          </button>
          <button
            aria-label="Dạng danh sách"
            aria-pressed={filters.view === "list"}
            className={`flex size-8 cursor-pointer items-center justify-center rounded transition-colors focus-visible:outline-2 focus-visible:outline-primary ${filters.view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-[#fff4ed] hover:text-primary"}`}
            disabled={isPending}
            onClick={() => navigate({ view: "list", page: filters.page })}
            title="Dạng danh sách"
            type="button"
          >
            <List aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
