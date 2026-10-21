"use client";

import { Search } from "lucide-react";

import {
  CATEGORY_TILE_CLASS_NAME,
  CategoryTileContent,
} from "@/components/catalog/category-tile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import {
  ALL_PUBLIC_AREAS,
  getPublicAreaLabel,
  parsePublicArea,
  PUBLIC_FEATURED_PROVINCES,
} from "@/lib/locations/public-area";
import { usePublicArea } from "@/providers/public-area-provider";
import type { ProductBrowseData } from "@/types/product-browse";
import { hasCatalogListings } from "@/utils/catalog";
import { ProductRefreshButton } from "./product-refresh-button";
import { ProductSpecificationQuickFilters } from "./product-specification-quick-filters";

type Props = Pick<ProductBrowseData, "filters" | "categories" | "equipmentTypes" | "products" | "specificationFields">;

const CATEGORY_SLIDE_CLASS_NAME = "basis-24 pl-0 sm:basis-28";
const CATEGORY_ARROW_CLASS_NAME =
  "size-8 border-[#eadfd8] bg-background text-foreground shadow-md backdrop-blur-none hover:border-primary hover:bg-background hover:text-primary disabled:hidden";

export function ProductDiscoveryFilters({ filters, categories, equipmentTypes, products, specificationFields }: Props) {
  const { isPending, navigate } = useProductBrowseNavigation();
  const { area, isApplyingArea, openPicker, selectArea } = usePublicArea();
  const appliedArea = parsePublicArea({
    provinceCode: filters.provinceCode ?? "",
    wardCode: filters.wardCode ?? "",
  }) ?? ALL_PUBLIC_AREAS;
  const selectedArea = area ?? appliedArea;
  const selectedAreaLabel = getPublicAreaLabel(selectedArea);
  const categoryItems = categories.success
    ? categories.data.data.filter((category) => category.isActive && hasCatalogListings(category))
    : [];
  const selectedCategory = categoryItems.find((category) => category.id === filters.categoryId);
  const typeItems = equipmentTypes.success && selectedCategory
    ? equipmentTypes.data.data.filter(
      (type) => hasCatalogListings(type) && type.categories.some((category) => category.id === selectedCategory.id),
    )
    : [];
  const hasDetailedArea = Boolean(selectedArea.wardCode) || Boolean(
    selectedArea.provinceCode &&
    !PUBLIC_FEATURED_PROVINCES.some((province) => province.code === selectedArea.provinceCode),
  );

  function selectCategory(categoryId?: string) {
    navigate({ categoryId, equipmentTypeId: undefined, filters: undefined });
  }

  return (
    <section
      aria-label="Khám phá thiết bị theo khu vực, danh mục và thông số"
      className="bg-background"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 py-2">
        <span className="shrink-0 text-xs text-muted-foreground">Khu vực:</span>
        <div aria-label="Khu vực tiêu biểu" className="flex min-w-0 gap-2 overflow-x-auto pb-1" role="group">
          <button
            aria-pressed={!selectedArea.provinceCode}
            className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary disabled:opacity-50 ${!selectedArea.provinceCode ? "border-primary bg-primary/5 text-primary" : "border-[#eadfd8]"}`}
            disabled={isApplyingArea}
            onClick={() => selectArea(ALL_PUBLIC_AREAS)}
            type="button"
          >
            Toàn quốc
          </button>
          {PUBLIC_FEATURED_PROVINCES.map((province) => (
            <button
              aria-pressed={selectedArea.provinceCode === province.code && !selectedArea.wardCode}
              className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary disabled:opacity-50 ${selectedArea.provinceCode === province.code && !selectedArea.wardCode ? "border-primary bg-primary/5 text-primary" : "border-[#eadfd8]"}`}
              disabled={isApplyingArea}
              key={province.code}
              onClick={() => selectArea({ provinceCode: province.code, wardCode: "" })}
              type="button"
            >
              {province.label}
            </button>
          ))}
          <button
            aria-pressed={hasDetailedArea}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary ${hasDetailedArea ? "border-primary bg-primary/5 text-primary" : "border-[#eadfd8]"}`}
            onClick={openPicker}
            type="button"
          >
            <Search aria-hidden="true" className="size-3.5" />
            {hasDetailedArea ? selectedAreaLabel : "Khu vực khác"}
          </button>
        </div>
      </div>
      <div className="py-2">
        {filters.equipmentTypeId ? (
          <ProductSpecificationQuickFilters filters={filters} products={products} specificationFields={specificationFields} />
        ) : selectedCategory && typeItems.length > 0 ? (
          <Carousel aria-label={`Chọn loại thiết bị trong ${selectedCategory.name}`} className="w-full select-none" opts={{ align: "start", dragFree: true, slidesToScroll: "auto" }}>
            <CarouselContent className="ml-0 items-start">
              {typeItems.map((type) => (
                <CarouselItem className={CATEGORY_SLIDE_CLASS_NAME} key={type.id}>
                  <button
                    className={`${CATEGORY_TILE_CLASS_NAME} w-full cursor-pointer disabled:opacity-50`}
                    disabled={isPending}
                    onClick={() => navigate({ equipmentTypeId: type.id, filters: undefined })}
                    type="button"
                  >
                    <CategoryTileContent category={{ name: type.name, imageUrl: type.thumbnailUrl }} />
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious aria-label="Loại thiết bị trước" className={`${CATEGORY_ARROW_CLASS_NAME} left-0`} />
            <CarouselNext aria-label="Loại thiết bị tiếp theo" className={`${CATEGORY_ARROW_CLASS_NAME} right-0`} />
          </Carousel>
        ) : categories.success ? (
          categoryItems.length > 0 ? (
            <Carousel aria-label="Chọn danh mục thiết bị" className="w-full select-none" opts={{ align: "start", dragFree: true, slidesToScroll: "auto" }}>
              <CarouselContent className="ml-0 items-start">
                {categoryItems.map((category) => (
                  <CarouselItem className={CATEGORY_SLIDE_CLASS_NAME} key={category.id}>
                    <button
                      aria-pressed={filters.categoryId === category.id}
                      className={`${CATEGORY_TILE_CLASS_NAME} w-full cursor-pointer disabled:opacity-50 ${filters.categoryId === category.id ? "bg-primary/5 text-primary" : ""}`}
                      disabled={isPending}
                      onClick={() => selectCategory(category.id)}
                      type="button"
                    >
                      <CategoryTileContent category={category} />
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious aria-label="Danh mục trước" className={`${CATEGORY_ARROW_CLASS_NAME} left-0`} />
              <CarouselNext aria-label="Danh mục tiếp theo" className={`${CATEGORY_ARROW_CLASS_NAME} right-0`} />
            </Carousel>
          ) : <p className="py-3 text-sm text-muted-foreground">Chưa có danh mục thiết bị.</p>
        ) : (
          <div className="flex items-center gap-3 py-3 text-sm text-error">
            <span>Không thể tải danh mục.</span>
            <ProductRefreshButton />
          </div>
        )}

        {selectedCategory && !equipmentTypes.success && !filters.equipmentTypeId ? (
          <div className="mt-3 flex items-center gap-3 pt-3 text-sm text-error">
            <span>Không thể tải loại thiết bị.</span>
            <ProductRefreshButton />
          </div>
        ) : null}
      </div>
    </section>
  );
}
