"use client";

import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover } from "radix-ui";

import { Input } from "@/components/ui/input";
import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import type { ProductBrowseData } from "@/types/product-browse";
import { hasCatalogListings } from "@/utils/catalog";
import { ProductRefreshButton } from "./product-refresh-button";

type Props = Pick<ProductBrowseData, "filters" | "brands">;

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLocaleLowerCase("vi");
}

export function ProductBrandPopover({ filters, brands }: Props) {
  const { isPending, navigate, resetFilters } = useProductBrowseNavigation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const options = brands.success ? brands.data.data.filter(hasCatalogListings) : [];
  const selected = options.find((brand) => brand.id === filters.brandId);
  const matches = options.filter((brand) => normalized(brand.name).includes(normalized(query.trim())));

  function select(brandId?: string) {
    navigate({ brandId });
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <Popover.Trigger asChild>
        <button
          className={`inline-flex h-9 max-w-44 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${filters.brandId ? "border-primary bg-primary/5 text-primary" : "border-[#eadfd8] bg-background text-foreground"}`}
          type="button"
        >
          <span className="truncate">{selected?.name ?? "Thương hiệu"}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="z-50 w-[min(320px,calc(100vw-1.5rem))] rounded-xl border border-[#eadfd8] bg-background p-3 text-foreground shadow-xl outline-none"
          collisionPadding={12}
          sideOffset={8}
        >
          <h2 className="mb-3 text-sm font-semibold">Thương hiệu</h2>
          {brands.success ? (
            <>
              <div className="relative mb-2">
                <Search aria-hidden="true" className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Tìm thương hiệu"
                  className="h-9 border-[#eadfd8] pl-8 text-xs"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm thương hiệu..."
                  type="search"
                  value={query}
                />
              </div>
              <div className="max-h-[min(55dvh,320px)] overflow-y-auto">
                <button
                  className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-2.5 text-left text-sm hover:bg-[#fff4ed] disabled:opacity-50"
                  disabled={isPending}
                  onClick={() => select()}
                  type="button"
                >
                  Tất cả thương hiệu
                  {!filters.brandId ? <Check aria-hidden="true" className="size-4 text-primary" /> : null}
                </button>
                {matches.map((brand) => (
                  <button
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-2.5 text-left text-sm hover:bg-[#fff4ed] disabled:opacity-50"
                    disabled={isPending}
                    key={brand.id}
                    onClick={() => select(brand.id)}
                    type="button"
                  >
                    <span className="truncate">{brand.name}</span>
                    {brand.id === filters.brandId ? <Check aria-hidden="true" className="size-4 shrink-0 text-primary" /> : null}
                  </button>
                ))}
                {matches.length === 0 ? <p className="px-2 py-3 text-xs text-muted-foreground">Không tìm thấy thương hiệu.</p> : null}
              </div>
            </>
          ) : (
            <div className="space-y-2 text-sm text-error">
              <p>Không thể tải thương hiệu.</p>
              <ProductRefreshButton />
            </div>
          )}
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
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
