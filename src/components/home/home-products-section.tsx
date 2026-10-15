import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { QueryProvider } from "@/providers/query-provider";
import { getCatalogCategories } from "@/services/queries/catalog-queries";
import { hasCatalogListings } from "@/utils/catalog";
import { HomeCategoryProducts } from "./home-category-products";
import { HomeCategoryProductsSkeleton } from "./home-products-skeleton";

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
      <HomeCategoryProducts category={category} key={category.id} />
    ));
}
