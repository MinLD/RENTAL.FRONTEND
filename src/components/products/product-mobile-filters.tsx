"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import type { ProductBrowseData } from "@/types/product-browse";
import { hasCatalogListings } from "@/utils/catalog";
import { ProductSpecificationFilters } from "./product-specification-filters";

type Props = Pick<ProductBrowseData, "filters" | "brands" | "specificationFields">;

export function ProductMobileFilters({ filters, brands, specificationFields }: Props) {
  const { isPending, navigate, resetFilters } = useProductBrowseNavigation();
  const [open, setOpen] = useState(false);
  const activeCount =
    Number(Boolean(filters.brandId)) + Number(Boolean(filters.filters));

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:hidden ${activeCount ? "border-primary bg-primary/5 text-primary" : "border-[#eadfd8] bg-background text-foreground"}`}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" className="size-3.5" />
          Bộ lọc{activeCount ? ` (${activeCount})` : ""}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[51] max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-background p-4 text-foreground shadow-2xl outline-none sm:hidden">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Dialog.Title className="text-base font-bold">Bộ lọc thiết bị</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Đóng bộ lọc" className="grid size-8 cursor-pointer place-items-center rounded hover:bg-primary/5" type="button">
                <X aria-hidden="true" className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <section className="space-y-2 border-b border-border pb-5">
            <label className="block text-xs font-bold uppercase" htmlFor="mobile-product-brand">
              Thương hiệu
            </label>
            {brands.success ? (
              <select
                className="h-10 w-full rounded border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                disabled={isPending}
                id="mobile-product-brand"
                onChange={(event) => {
                  navigate({ brandId: event.target.value || undefined });
                  setOpen(false);
                }}
                value={filters.brandId ?? ""}
              >
                <option value="">Tất cả thương hiệu</option>
                {brands.data.data.filter(hasCatalogListings).map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            ) : <p className="text-sm text-error">Không thể tải thương hiệu.</p>}
          </section>


          {filters.equipmentTypeId ? (
            <div className="border-b border-border py-5">
              <ProductSpecificationFilters
                key={JSON.stringify([filters.equipmentTypeId, filters.filters, specificationFields])}
                filters={filters}
                onApplied={() => setOpen(false)}
                specificationFields={specificationFields}
              />
            </div>
          ) : null}

          <button
            className="mt-5 w-full cursor-pointer rounded border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            disabled={isPending}
            onClick={() => {
              resetFilters();
              setOpen(false);
            }}
            type="button"
          >
            Xóa bộ lọc
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
