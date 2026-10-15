import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { HOME_PRODUCTS_PAGE_SIZE } from "@/config/homepage";
import { QueryProvider } from "@/providers/query-provider";
import { getCatalogCategories, getCatalogEquipmentTypes } from "@/services/queries/catalog-queries";
import { getPublicEquipmentListings } from "@/services/queries/inventory-queries";
import type { CatalogCategoryDetail } from "@/types/catalog";
import { hasCatalogListings } from "@/utils/catalog";
import { HomeProductCarousel } from "./home-product-carousel";
import { HomeProductsSkeleton } from "./home-products-skeleton";

export function HomeProductsSection() {
  return (
    <QueryProvider>
      <Suspense fallback={<HomeCategoryProductsSkeleton />}>
        <HomeProductCategories />
      </Suspense>
    </QueryProvider>
  );
}

async function HomeProductCategories() {
  const result = await getCatalogCategories();
  if (!result.success) {
    return <EmptyState className="mt-10 min-h-40" title="Không thể tải danh mục sản phẩm" description="Vui lòng tải lại trang hoặc thử lại sau." />;
  }
  return result.data.data
    .filter((category) => category.isActive && category.id && hasCatalogListings(category))
    .map((category) => (
      <Suspense fallback={<HomeCategoryProductsSkeleton name={category.name} />} key={category.id}>
        <HomeCategoryProducts category={category} />
      </Suspense>
    ));
}

async function getCategoryEquipmentTypes(categoryId: string) {
  const params = { categoryId, pageSize: 100, sort: "name_asc" };
  const first = await getCatalogEquipmentTypes({ ...params, page: 1 });
  if (!first.success || first.data.totalPages <= 1) return first;
  const remaining = await Promise.all(
    Array.from({ length: first.data.totalPages - 1 }, (_, index) =>
      getCatalogEquipmentTypes({ ...params, page: index + 2 }),
    ),
  );
  const failed = remaining.find((page) => !page.success);
  if (failed) return failed;
  return {
    ...first,
    data: {
      ...first.data,
      data: [...first.data.data, ...remaining.flatMap((page) => page.success ? page.data.data : [])],
    },
  };
}

async function HomeCategoryProducts({ category }: { category: CatalogCategoryDetail }) {
  const [products, equipmentTypes] = await Promise.all([
    getPublicEquipmentListings({ categoryId: category.id, page: 1, pageSize: HOME_PRODUCTS_PAGE_SIZE, sort: "created_desc" }),
    getCategoryEquipmentTypes(category.id),
  ]);
  return (
    <HomeProductCarousel
      category={category}
      equipmentTypes={equipmentTypes.success ? equipmentTypes.data.data.filter((type) => type.id && hasCatalogListings(type)) : []}
      equipmentTypesFailed={!equipmentTypes.success}
      initialProducts={products.success ? products.data : undefined}
    />
  );
}

function HomeCategoryProductsSkeleton({ name }: { name?: string }) {
  return (
    <section aria-label={name ? `Đang tải ${name}` : "Đang tải sản phẩm theo danh mục"} className="mt-8 sm:mt-10">
      {name ? <h2 className="mb-4 border-l-3 border-primary pl-2.5 text-xs font-bold uppercase sm:text-sm">{name}</h2> : <Skeleton className="mb-4 h-5 w-48" />}
      <Skeleton className="mb-4 h-8 w-64 max-w-full" />
      <HomeProductsSkeleton />
    </section>
  );
}
