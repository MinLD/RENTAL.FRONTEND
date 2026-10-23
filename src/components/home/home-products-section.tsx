import { Suspense } from "react";

import { HOME_PRODUCTS_FEED_PARAMS } from "@/config/homepage";
import { QueryProvider } from "@/providers/query-provider";
import { getPublicEquipmentListings } from "@/services/queries/inventory-queries";
import { getCurrentUser } from "@/services/session-service";
import { HomeProductsFeed } from "./home-products-feed";
import { HomeProductsFeedSkeleton } from "./home-products-skeleton";
import { HomeProductsTabs } from "./home-products-tabs";

export async function HomeProductsSection() {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  return (
    <section aria-label="Thiết bị cho thuê" className="mt-4 sm:mt-6">
      <QueryProvider key={userId ?? "guest"}>
        <HomeProductsTabs userId={userId}>
          <Suspense fallback={<HomeProductsFeedSkeleton />}>
            <HomeLatestProducts userId={userId} />
          </Suspense>
        </HomeProductsTabs>
      </QueryProvider>
    </section>
  );
}

async function HomeLatestProducts({ userId }: { userId: string | null }) {
  const result = await getPublicEquipmentListings({
    ...HOME_PRODUCTS_FEED_PARAMS,
    sort: "created_desc",
    page: 1,
  });
  return (
    <HomeProductsFeed
      initialLoadFailed={!result.success}
      initialPage={result.success ? result.data : undefined}
      sort="created_desc"
      userId={userId}
    />
  );
}
