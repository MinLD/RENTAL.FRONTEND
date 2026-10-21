"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover } from "radix-ui";

import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import type { ProductBrowseData } from "@/types/product-browse";
import { hasCatalogListings } from "@/utils/catalog";
import { ProductRefreshButton } from "./product-refresh-button";

type Props = Pick<ProductBrowseData, "filters" | "categories" | "equipmentTypes">;

export function ProductCategoryPopover({ filters, categories, equipmentTypes }: Props) {
  const { isPending, navigate, resetFilters } = useProductBrowseNavigation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [showMobileTypes, setShowMobileTypes] = useState(false);
  const [submenuTop, setSubmenuTop] = useState(0);
  const categoryItems = categories.success
    ? categories.data.data.filter((category) => category.isActive && hasCatalogListings(category))
    : [];
  const typeItems = equipmentTypes.success
    ? equipmentTypes.data.data.filter(hasCatalogListings)
    : [];
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const hoveredCategoryId = activeCategoryId;
  const hoveredCategory = categoryItems.find((category) => category.id === hoveredCategoryId);
  const typesForCategory = typeItems.filter((type) =>
    type.categories.some((category) => category.id === hoveredCategoryId),
  );
  const selectedCategory = categoryItems.find((category) => category.id === filters.categoryId);
  const selectedType = typeItems.find((type) => type.id === filters.equipmentTypeId);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setActiveCategoryId(null);
    setShowMobileTypes(false);
  }

  function selectCategory(categoryId?: string, equipmentTypeId?: string) {
    navigate({ categoryId, equipmentTypeId, filters: undefined });
    setOpen(false);
    setShowMobileTypes(false);
  }

  function categoryTypes(categoryId: string) {
    return typeItems.filter((type) =>
      type.categories.some((category) => category.id === categoryId),
    );
  }

  function activateCategory(categoryId: string, row: HTMLElement) {
    const types = categoryTypes(categoryId);
    if (types.length === 0) {
      setActiveCategoryId(null);
      return;
    }

    const contentTop = contentRef.current?.getBoundingClientRect().top ?? 0;
    const rowTop = row.getBoundingClientRect().top - contentTop;
    const submenuHeight = Math.min(440, (types.length + 1) * 44);
    const availableTop = Math.max(0, window.innerHeight - contentTop - submenuHeight - 12);
    setSubmenuTop(Math.max(0, Math.min(rowTop, availableTop)));
    setActiveCategoryId(categoryId);
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          className={`inline-flex h-9 max-w-52 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${filters.categoryId ? "border-primary bg-primary/5 text-primary" : "border-[#eadfd8] bg-background text-foreground"}`}
          type="button"
        >
          <span className="truncate">{selectedType?.name ?? selectedCategory?.name ?? "Danh mục"}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="relative z-50 w-[min(380px,calc(100vw-1.5rem))] rounded-2xl border border-[#eadfd8] bg-background text-foreground shadow-xl outline-none"
          collisionPadding={12}
          ref={contentRef}
          sideOffset={8}
        >
          <div className="overflow-hidden rounded-2xl">
          <div className="border-b border-[#f0e8e2] px-4 py-3 text-center text-sm font-medium">
            {showMobileTypes && hoveredCategory ? (
              <button className="flex w-full cursor-pointer items-center gap-2 text-left lg:hidden" onClick={() => setShowMobileTypes(false)} type="button">
                <ChevronLeft aria-hidden="true" className="size-4" />
                {hoveredCategory.name}
              </button>
            ) : "Danh mục"}
          </div>
          <div className={showMobileTypes ? "hidden lg:block" : "block"}>
            <div className="max-h-[min(62dvh,610px)] overflow-y-auto py-1" onScroll={() => setActiveCategoryId(null)}>
              {categories.success ? categoryItems.map((category) => (
                <button
                  aria-expanded={categoryTypes(category.id).length > 0 ? hoveredCategoryId === category.id : undefined}
                  className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 px-6 py-2 text-left text-sm transition-colors hover:bg-[#fff4ed] ${hoveredCategoryId === category.id ? "bg-[#fff4ed]" : ""}`}
                  disabled={isPending}
                  key={category.id}
                  onClick={(event) => {
                    if (categoryTypes(category.id).length === 0) selectCategory(category.id);
                    else {
                      activateCategory(category.id, event.currentTarget);
                      setShowMobileTypes(true);
                    }
                  }}
                  onFocus={(event) => activateCategory(category.id, event.currentTarget)}
                  onMouseEnter={(event) => activateCategory(category.id, event.currentTarget)}
                  type="button"
                >
                  <span className="min-w-0 truncate">{category.name}</span>
                  {categoryTypes(category.id).length > 0 ? <ChevronRight aria-hidden="true" className="size-4 shrink-0" /> : filters.categoryId === category.id ? <Check aria-hidden="true" className="size-4 shrink-0 text-primary" /> : null}
                </button>
              )) : (
                <div className="space-y-2 px-4 py-4 text-sm text-error">
                  <p>Không thể tải danh mục.</p>
                  <ProductRefreshButton />
                </div>
              )}
            </div>
            <div className="border-t border-[#f0e8e2] p-3">
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
          </div>
          </div>
            <div
              className={`${showMobileTypes ? "block" : "hidden"} max-h-[min(62dvh,440px)] overflow-y-auto bg-background py-1 lg:absolute lg:left-[calc(100%-1px)] lg:w-60 lg:rounded-lg lg:border lg:border-[#eadfd8] lg:shadow-xl ${hoveredCategory && typesForCategory.length > 0 ? "lg:block" : "lg:hidden"}`}
              style={{ top: submenuTop }}
            >
              {hoveredCategory ? (
                <>
                  <button
                    className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 px-6 py-2 text-left text-sm transition-colors hover:bg-[#fff4ed] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isPending}
                    onClick={() => selectCategory(hoveredCategory.id)}
                    type="button"
                  >
                    Tất cả {hoveredCategory.name}
                    {filters.categoryId === hoveredCategory.id && !filters.equipmentTypeId ? <Check aria-hidden="true" className="size-4 text-primary" /> : null}
                  </button>
                  {equipmentTypes.success ? typesForCategory.map((type) => (
                    <button
                      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 px-6 py-2 text-left text-sm transition-colors hover:bg-[#fff4ed] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isPending}
                      key={type.id}
                      onClick={() => selectCategory(hoveredCategory.id, type.id)}
                      type="button"
                    >
                      <span className="min-w-0 truncate">{type.name}</span>
                      {filters.equipmentTypeId === type.id ? <Check aria-hidden="true" className="size-4 shrink-0 text-primary" /> : null}
                    </button>
                  )) : (
                    <div className="space-y-2 px-4 py-3 text-sm text-error">
                      <p>Không thể tải loại thiết bị.</p>
                      <ProductRefreshButton />
                    </div>
                  )}
                </>
              ) : null}
            </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
