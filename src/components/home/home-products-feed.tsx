"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { PRODUCT_FEED_GRID_CLASS_NAME, PRODUCT_FEED_IMAGE_SIZES } from "@/config/product-images";
import {
  HOME_PRODUCTS_FEED_PARAMS,
  HOME_PRODUCTS_STALE_TIME,
  type HomeProductsSort,
} from "@/config/homepage";
import { fetchPublicEquipmentListings } from "@/services/public-inventory-service";
import type { PublicEquipmentListingListResponse } from "@/types/inventory";
import { HomeProductsFeedSkeleton } from "./home-products-skeleton";

export function HomeProductsFeed({
  sort,
  userId,
  initialLoadFailed = false,
  initialPage,
}: {
  sort: HomeProductsSort;
  userId: string | null;
  initialLoadFailed?: boolean;
  initialPage?: PublicEquipmentListingListResponse;
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const params = { ...HOME_PRODUCTS_FEED_PARAMS, sort };
  const isRecommended = sort === "recommended";
  const query = useInfiniteQuery({
    queryKey: ["home", "products", userId, params],
    queryFn: ({ pageParam, signal }) =>
      fetchPublicEquipmentListings(
        {
          ...params,
          page: pageParam,
        },
        signal,
      ),
    initialPageParam: 1,
    initialData: initialPage
      ? { pages: [initialPage], pageParams: [1] }
      : undefined,
    enabled: !initialLoadFailed,
    getNextPageParam: (lastPage) =>
      lastPage.items.length > 0 && lastPage.page < lastPage.totalPages
        ? lastPage.page + 1
        : undefined,
    staleTime: HOME_PRODUCTS_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const { fetchNextPage, hasNextPage, isFetching, isFetchNextPageError } =
    query;

  useEffect(() => {
    if (
      !hasNextPage ||
      isFetching ||
      isFetchNextPageError ||
      !loadMoreRef.current
    )
      return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage({ cancelRefetch: false });
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching, isFetchNextPageError]);

  if ((initialLoadFailed || query.isError) && !query.data) {
    return (
      <ErrorState
        className="min-h-64"
        title={isRecommended ? "Không thể tải thiết bị dành cho bạn" : "Không thể tải thiết bị mới nhất"}
        description="Vui lòng thử tải lại danh sách thiết bị."
        action={
          <Button disabled={query.isFetching} onClick={() => void query.refetch()} size="sm">
            {query.isFetching ? "Đang thử lại..." : "Thử lại"}
          </Button>
        }
      />
    );
  }

  if (query.isPending) return <HomeProductsFeedSkeleton />;

  const products = Array.from(
    new Map(
      query.data?.pages
        .flatMap((page) => page.items)
        .map((product) => [product.id, product]),
    ).values(),
  );

  if (!products.length) {
    return (
      <EmptyState
        className="min-h-64"
        title={isRecommended ? "Chưa có gợi ý dành cho bạn" : "Chưa có thiết bị cho thuê"}
        description={isRecommended ? "Các thiết bị phù hợp sẽ được hiển thị tại đây." : "Các thiết bị mới sẽ được hiển thị tại đây."}
      />
    );
  }

  return (
    <>
      <ul
        aria-label={isRecommended ? "Thiết bị dành cho bạn" : "Thiết bị mới nhất"}
        className={PRODUCT_FEED_GRID_CLASS_NAME}
      >
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard
              product={product}
              imageSizes={PRODUCT_FEED_IMAGE_SIZES}
            />
          </li>
        ))}
      </ul>
      <div
        className={query.isFetchingNextPage
          ? "pt-3 sm:pt-4"
          : "flex min-h-24 items-center justify-center py-6"}
        ref={loadMoreRef}
      >
        {query.isFetchingNextPage ? (
          <HomeProductsFeedSkeleton />
        ) : isFetchNextPageError ? (
          <div
            className="flex flex-col items-center gap-3 text-center"
            role="alert"
          >
            <p className="text-sm text-muted-foreground">
              Không thể tải thêm thiết bị.
            </p>
            <Button
              disabled={isFetching}
              onClick={() => void fetchNextPage({ cancelRefetch: false })}
              size="sm"
              variant="secondary"
            >
              Thử lại
            </Button>
          </div>
        ) : hasNextPage ? (
          <p
            className="flex items-center gap-2 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            Cuộn xuống để xem thêm thiết bị
          </p>
        ) : null}
      </div>
    </>
  );
}
