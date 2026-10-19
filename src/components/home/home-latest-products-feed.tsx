"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import {
  HOME_LATEST_PRODUCT_IMAGE_SIZES,
  HOME_LATEST_PRODUCTS_GRID_CLASS_NAME,
  HOME_LATEST_PRODUCTS_PARAMS,
  HOME_PRODUCTS_STALE_TIME,
} from "@/config/homepage";
import { fetchPublicEquipmentListings } from "@/services/public-inventory-service";
import type { PublicEquipmentListingListResponse } from "@/types/inventory";
import { HomeLatestProductsSkeleton } from "./home-products-skeleton";

export function HomeLatestProductsFeed({
  initialPage,
}: {
  initialPage?: PublicEquipmentListingListResponse;
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const query = useInfiniteQuery({
    queryKey: ["home", "latest-products", HOME_LATEST_PRODUCTS_PARAMS],
    queryFn: ({ pageParam, signal }) =>
      fetchPublicEquipmentListings(
        {
          ...HOME_LATEST_PRODUCTS_PARAMS,
          page: pageParam,
        },
        signal,
      ),
    initialPageParam: 1,
    initialData: initialPage
      ? { pages: [initialPage], pageParams: [1] }
      : undefined,
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

  if (query.isPending) return <HomeLatestProductsSkeleton />;

  if (query.isError && !query.data) {
    return (
      <EmptyState
        className="min-h-64"
        title="Không thể tải thiết bị mới nhất"
        description="Vui lòng thử tải lại danh sách thiết bị."
        icon={<AlertCircle />}
        role="alert"
        action={
          <Button onClick={() => void query.refetch()} size="sm">
            Thử lại
          </Button>
        }
      />
    );
  }

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
        title="Chưa có thiết bị cho thuê"
        description="Các thiết bị mới sẽ được hiển thị tại đây."
      />
    );
  }

  return (
    <>
      <ul
        aria-label="Thiết bị mới nhất"
        className={HOME_LATEST_PRODUCTS_GRID_CLASS_NAME}
      >
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard
              product={product}
              imageSizes={HOME_LATEST_PRODUCT_IMAGE_SIZES}
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
          <HomeLatestProductsSkeleton />
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
