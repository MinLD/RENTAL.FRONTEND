"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import type { ProductBrowseFilters } from "@/types/product-browse";

export function ProductSearch({ filters }: { filters: ProductBrowseFilters }) {
  const [keyword, setKeyword] = useState(filters.q ?? "");
  const { isPending, navigate } = useProductBrowseNavigation();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ q: keyword.trim() || undefined });
  }
  return (
    <form
      action="/products"
      aria-label="Tìm kiếm sản phẩm"
      className="flex min-w-0 gap-2"
      method="get"
      onSubmit={submit}
    >
      {filters.categoryId ? (
        <input name="categoryId" type="hidden" value={filters.categoryId} />
      ) : null}
      {filters.equipmentTypeId ? (
        <input
          name="equipmentTypeId"
          type="hidden"
          value={filters.equipmentTypeId}
        />
      ) : null}
      <input name="pageSize" type="hidden" value={filters.pageSize} />
      {filters.brandId ? (
        <input name="brandId" type="hidden" value={filters.brandId} />
      ) : null}
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <label className="sr-only" htmlFor="product-search">
          Tìm kiếm sản phẩm
        </label>
        <Input
          className="bg-background pl-9 text-sm"
          disabled={isPending}
          id="product-search"
          name="q"
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm tên thiết bị, model..."
          type="search"
          value={keyword}
        />
      </div>
      <Button
        className="bg-secondary text-xs uppercase text-secondary-foreground hover:bg-secondary/90"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Đang tìm..." : "Tìm kiếm"}
      </Button>
    </form>
  );
}
