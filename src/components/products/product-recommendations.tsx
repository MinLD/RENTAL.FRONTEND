import { Suspense } from "react";

import { ErrorState } from "@/components/error-state";
import { PRODUCT_FEED_GRID_CLASS_NAME, PRODUCT_FEED_IMAGE_SIZES } from "@/config/product-images";
import { getPublicEquipmentListings } from "@/services/queries/inventory-queries";
import { ProductGridSkeleton } from "./product-browse-skeleton";
import { ProductCard } from "./product-card";
import { ProductRefreshButton } from "./product-refresh-button";

export function ProductRecommendations() {
  return (
    <section aria-labelledby="product-recommendations-title" className="space-y-4 pt-6 sm:pt-8">
      <h2 className="border-l-3 border-primary pl-2.5 text-sm font-bold uppercase" id="product-recommendations-title">
        Gợi ý cho bạn
      </h2>
      <Suspense fallback={<ProductGridSkeleton />}>
        <RecommendedProducts />
      </Suspense>
    </section>
  );
}

async function RecommendedProducts() {
  // Keep failed search terms and filters out of the fallback recommendations.
  // The server service forwards the current session cookie when one exists.
  const result = await getPublicEquipmentListings({ sort: "recommended", page: 1, pageSize: 10 });

  if (!result.success) {
    return (
      <ErrorState
        className="min-h-64"
        title="Không thể tải gợi ý cho bạn"
        description="Vui lòng thử tải lại danh sách thiết bị."
        action={<ProductRefreshButton />}
      />
    );
  }

  if (!result.data.items.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground" role="status">Chưa có thiết bị gợi ý.</p>;
  }

  return (
    <ul aria-label="Thiết bị gợi ý cho bạn" className={PRODUCT_FEED_GRID_CLASS_NAME}>
      {result.data.items.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} imageSizes={PRODUCT_FEED_IMAGE_SIZES} />
        </li>
      ))}
    </ul>
  );
}
