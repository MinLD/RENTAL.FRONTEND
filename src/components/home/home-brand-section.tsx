import { Suspense } from "react";

import { HOME_BRANDS_PAGE_SIZE } from "@/config/homepage";
import { QueryProvider } from "@/providers/query-provider";
import { getCatalogBrands } from "@/services/queries/catalog-queries";
import { HomeBrandCarousel } from "./home-brand-carousel";
import { HomeBrandSkeleton } from "./home-brand-skeleton";

export function HomeBrandSection() {
  return (
    <section aria-labelledby="home-brand-title" className="mt-8 sm:mt-10">
      <QueryProvider>
        <Suspense fallback={
          <>
            <h2 className="mb-4 border-l-3 border-primary pl-2.5 text-xs font-bold uppercase sm:text-sm" id="home-brand-title">
              Thương hiệu
            </h2>
            <HomeBrandSkeleton />
          </>
        }>
          <HomeBrandItems />
        </Suspense>
      </QueryProvider>
    </section>
  );
}

async function HomeBrandItems() {
  const result = await getCatalogBrands({
    page: 1,
    pageSize: HOME_BRANDS_PAGE_SIZE,
    sort: "name_asc",
  });
  return <HomeBrandCarousel initialBrands={result.success ? result.data : undefined} />;
}
