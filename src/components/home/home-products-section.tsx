import { Suspense } from "react";

import { HOME_LATEST_PRODUCTS_PARAMS } from "@/config/homepage";
import { QueryProvider } from "@/providers/query-provider";
import { getPublicEquipmentListings } from "@/services/queries/inventory-queries";
import { HomeLatestProductsFeed } from "./home-latest-products-feed";
import { HomeLatestProductsSkeleton } from "./home-products-skeleton";

export function HomeProductsSection() {
  return (
    <section aria-labelledby="home-latest-products-title" className="mt-4 sm:mt-6">
      <div className="sticky top-[var(--site-header-height,6rem)] z-20 mb-4 bg-background py-3 sm:py-4">
        <h2
          className="border-l-3 border-primary pl-2.5 text-xs font-bold uppercase sm:text-sm"
          id="home-latest-products-title"
        >
          Mới nhất
        </h2>
      </div>
      <QueryProvider>
        <Suspense fallback={<HomeLatestProductsSkeleton />}>
          <HomeLatestProducts />
        </Suspense>
      </QueryProvider>
    </section>
  );
}

async function HomeLatestProducts() {
  const result = await getPublicEquipmentListings({
    ...HOME_LATEST_PRODUCTS_PARAMS,
    page: 1,
  });
  return (
    <HomeLatestProductsFeed
      initialLoadFailed={!result.success}
      initialPage={result.success ? result.data : undefined}
    />
  );
}
