import { Suspense } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import {
  AllEquipmentTileContent,
  CATEGORY_TILE_CLASS_NAME,
  CategoryTileContent,
} from "@/components/catalog/category-tile";
import { EmptyState } from "@/components/empty-state";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogBrowseHref } from "@/config/catalog-navigation";
import { getCatalogCategories } from "@/services/queries/catalog-queries";
import type { CatalogCategoryDetail } from "@/types/catalog";
import { hasCatalogListings } from "@/utils/catalog";

const CATEGORY_SLIDE_CLASS_NAME = "basis-24 grow pl-0 sm:basis-28";
const CATEGORY_ARROW_CLASS_NAME =
  "size-8 border-border/60 bg-background text-foreground shadow-md backdrop-blur-none hover:border-primary hover:bg-background hover:text-primary disabled:hidden";

export function HomeCategorySection() {
  return (
    <section aria-labelledby="home-category-title" className="mt-8 sm:mt-10">
      <h2
        className="mb-4 border-l-3 border-primary pl-2.5 text-xs font-bold uppercase sm:text-sm"
        id="home-category-title"
      >
        Danh mục thiết bị
      </h2>
      <Carousel
        aria-label="Các danh mục thiết bị"
        className="w-full select-none rounded-xl bg-background px-3 py-3 sm:px-4 sm:py-4"
        opts={{ align: "start", dragFree: true, slidesToScroll: "auto" }}
      >
        <Suspense fallback={<HomeCategorySkeleton />}>
          <HomeCategoryItems />
        </Suspense>
        <CarouselPrevious
          aria-label="Danh mục trước"
          className={`${CATEGORY_ARROW_CLASS_NAME} left-1 sm:left-2`}
        />
        <CarouselNext
          aria-label="Danh mục tiếp theo"
          className={`${CATEGORY_ARROW_CLASS_NAME} right-1 sm:right-2`}
        />
      </Carousel>
    </section>
  );
}

async function HomeCategoryItems() {
  const result = await getCatalogCategories();
  if (!result.success) {
    return (
      <EmptyState
        className="min-h-28"
        description="Vui lòng tải lại trang hoặc thử lại sau."
        icon={<AlertCircle />}
        role="alert"
        title="Không thể tải danh mục thiết bị"
      />
    );
  }
  const categories = result.data.data.filter(
    (category) =>
      category.isActive && category.id && hasCatalogListings(category),
  );
  if (!categories.length) {
    return (
      <EmptyState className="min-h-28" title="Chưa có danh mục thiết bị" />
    );
  }
  return (
    <CarouselContent className="ml-0 items-start">
      {categories.map((category) => (
        <CarouselItem
          className={CATEGORY_SLIDE_CLASS_NAME}
          key={category.id}
        >
          <HomeCategoryCard category={category} />
        </CarouselItem>
      ))}
      <CarouselItem className={CATEGORY_SLIDE_CLASS_NAME}>
        <Link className={CATEGORY_TILE_CLASS_NAME} href={catalogBrowseHref()} prefetch={false}>
          <AllEquipmentTileContent />
        </Link>
      </CarouselItem>
    </CarouselContent>
  );
}

function HomeCategoryCard({ category }: { category: CatalogCategoryDetail }) {
  return (
    <Link
      className={CATEGORY_TILE_CLASS_NAME}
      href={catalogBrowseHref({ categoryId: category.id })}
      prefetch={false}
      title={category.name}
    >
      <CategoryTileContent category={category} heading />
    </Link>
  );
}

function HomeCategorySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải danh mục thiết bị"
      className="flex w-full overflow-hidden"
      role="status"
    >
      {Array.from({ length: 10 }, (_, index) => (
        <div
          aria-hidden="true"
          className="flex shrink-0 grow basis-24 flex-col items-center gap-2 px-2 py-1 sm:basis-28"
          key={index}
        >
          <Skeleton className="size-12 rounded-lg" />
          <div className="flex h-8 flex-col items-center gap-1 pt-1">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}
