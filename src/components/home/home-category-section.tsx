import { Suspense } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProductImage } from "@/components/products/product-image";
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

const CATEGORY_SLIDE_CLASS_NAME = "basis-1/2 sm:basis-1/3 lg:basis-1/5";
const CATEGORY_IMAGE_SIZES =
  "(min-width: 1024px) 208px, (min-width: 640px) 192px, 128px";
const CATEGORY_ARROW_CLASS_NAME =
  "size-8 border-border bg-background text-foreground shadow-none backdrop-blur-none hover:bg-primary hover:text-primary-foreground disabled:invisible";

export function HomeCategorySection() {
  return (
    <section
      aria-labelledby="home-category-title"
      className="mt-8 sm:mt-10"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2
          className="border-l-3 border-primary pl-2.5 text-xs font-bold uppercase sm:text-sm"
          id="home-category-title"
        >
          Danh mục thiết bị
        </h2>
        <Link
          className="inline-flex items-center gap-1.5 text-[10px] font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary sm:text-xs"
          href={catalogBrowseHref()}
          prefetch={false}
        >
          Xem tất cả danh mục
          <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
        </Link>
      </div>
      <Suspense fallback={<HomeCategorySkeleton />}>
        <HomeCategoryItems />
      </Suspense>
    </section>
  );
}

async function HomeCategoryItems() {
  const result = await getCatalogCategories();
  if (!result.success) {
    return (
      <EmptyState
        className="min-h-56"
        description="Vui lòng tải lại trang hoặc thử lại sau."
        icon={<AlertCircle />}
        role="alert"
        title="Không thể tải danh mục thiết bị"
      />
    );
  }
  const categories = result.data.data.filter(
    (category) => category.isActive && category.id && hasCatalogListings(category),
  );
  if (!categories.length) {
    return (
      <EmptyState
        className="min-h-56"
        title="Chưa có danh mục thiết bị"
      />
    );
  }
  // Fill the five desktop columns before starting the second row.
  const columnCount = Math.max(5, Math.ceil(categories.length / 2));
  const columns = categories.slice(0, columnCount).map((category, index) => [
    category,
    ...categories.slice(index + columnCount, index + columnCount + 1),
  ]);
  return (
    <Carousel
      aria-label="Các danh mục thiết bị"
      className="w-full select-none"
      opts={{ align: "start", loop: true }}
    >
      <CarouselContent className="-ml-3">
        {columns.map((column) => (
          <CarouselItem
            className={`${CATEGORY_SLIDE_CLASS_NAME} pl-3`}
            key={column[0].id}
          >
            <div className="flex flex-col gap-3">
              {column.map((category) => (
                <HomeCategoryCard category={category} key={category.id} />
              ))}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious
        aria-label="Danh mục trước"
        className={`left-0 hidden sm:inline-flex ${CATEGORY_ARROW_CLASS_NAME}`}
      />
      <CarouselNext
        aria-label="Danh mục tiếp theo"
        className={`right-0 hidden sm:inline-flex ${CATEGORY_ARROW_CLASS_NAME}`}
      />
    </Carousel>
  );
}

function HomeCategoryCard({ category }: { category: CatalogCategoryDetail }) {
  return (
    <Link
      className="group flex flex-col items-center gap-1.5 px-1 py-1 text-center focus-visible:outline-2 focus-visible:outline-primary"
      href={catalogBrowseHref({ categoryId: category.id })}
      prefetch={false}
    >
      <h3 className="flex h-15 items-center justify-center text-xs font-semibold leading-5 text-primary sm:h-10 sm:text-sm">
        {category.name}
      </h3>
      <div className="relative aspect-square w-full max-w-32 overflow-hidden rounded border border-border bg-background sm:max-w-48 lg:max-w-52">
        <ProductImage
          compact
          imageClassName="object-contain"
          name={category.name}
          sizes={CATEGORY_IMAGE_SIZES}
          src={category.imageUrl}
        />
      </div>
    </Link>
  );
}

function HomeCategorySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải danh mục thiết bị"
      className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      role="status"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div
          aria-hidden="true"
          className={`flex flex-col gap-3 ${index === 2 ? "hidden sm:flex" : index >= 3 ? "hidden lg:flex" : ""}`}
          key={index}
        >
          {Array.from({ length: 2 }, (_, row) => (
            <div className="flex flex-col items-center gap-1.5 px-1 py-1" key={row}>
              <div className="flex h-15 w-full items-center justify-center sm:h-10">
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="aspect-square w-full max-w-32 sm:max-w-48 lg:max-w-52" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
