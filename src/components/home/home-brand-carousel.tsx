"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselProps,
} from "@/components/ui/carousel";
import {
  CATALOG_NAVIGATION_STALE_TIME,
  catalogBrowseHref,
} from "@/config/catalog-navigation";
import { HOME_BRANDS_PAGE_SIZE } from "@/config/homepage";
import { fetchCatalogBrands } from "@/services/catalog-service";
import type { CatalogBrand, CatalogPagedResult } from "@/types/catalog";
import { hasCatalogListings } from "@/utils/catalog";
import { getProductImageSrc } from "@/utils/product-image";
import { HomeBrandSkeleton } from "./home-brand-skeleton";

type CarouselApi = Parameters<NonNullable<CarouselProps["setApi"]>>[0];
const SLIDE_CLASS_NAME = "basis-1/2 pl-3 sm:basis-1/4 lg:basis-1/6";
const ARROW_CLASS_NAME =
  "static size-8 translate-y-0 rounded border-border bg-background text-foreground shadow-none backdrop-blur-none hover:bg-primary hover:text-primary-foreground";

export function HomeBrandCarousel({
  initialBrands,
}: {
  initialBrands?: CatalogPagedResult<CatalogBrand>;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const query = useInfiniteQuery({
    queryKey: ["home", "brands"],
    queryFn: ({ pageParam, signal }) =>
      fetchCatalogBrands(
        {
          page: pageParam,
          pageSize: HOME_BRANDS_PAGE_SIZE,
          sort: "name_asc",
        },
        signal,
      ),
    initialPageParam: 1,
    initialData: initialBrands
      ? { pages: [initialBrands], pageParams: [1] }
      : undefined,
    getNextPageParam: (lastPage) =>
      lastPage.data.length > 0 && lastPage.page < lastPage.totalPages
        ? lastPage.page + 1
        : undefined,
    staleTime: CATALOG_NAVIGATION_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const brands = Array.from(
    new Map(
      query.data?.pages
        .flatMap((page) => page.data)
        .filter(
          (brand) => brand.id && brand.isActive && hasCatalogListings(brand),
        )
        .map((brand) => [brand.id, brand]),
    ).values(),
  );
  const { fetchNextPage, hasNextPage, isFetching, isFetchNextPageError } =
    query;

  useEffect(() => {
    if (!api || !hasNextPage || isFetching || isFetchNextPageError) return;
    const loadNext = () => {
      // Continue through pages with no eligible brands as well.
      if (
        !brands.length ||
        api.slidesInView().some((index) => index >= brands.length - 1)
      ) {
        void fetchNextPage({ cancelRefetch: false });
      }
    };
    loadNext();
    api.on("slidesInView", loadNext);
    api.on("reInit", loadNext);
    return () => {
      api.off("slidesInView", loadNext);
      api.off("reInit", loadNext);
    };
  }, [
    api,
    brands.length,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchNextPageError,
  ]);

  return (
    <Carousel
      aria-label="Các thương hiệu thiết bị"
      opts={{ align: "start", loop: false }}
      setApi={setApi}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2
          className="border-l-3 border-primary pl-2.5 text-xs font-bold uppercase sm:text-sm"
          id="home-brand-title"
        >
          Thương hiệu
        </h2>
        <div className="flex shrink-0 gap-2">
          <CarouselPrevious
            aria-label="Thương hiệu trước"
            className={ARROW_CLASS_NAME}
          />
          <CarouselNext
            aria-label="Thương hiệu tiếp theo"
            className={ARROW_CLASS_NAME}
          />
        </div>
      </div>
      {query.isPending ? (
        <HomeBrandSkeleton />
      ) : query.isError && !query.data ? (
        <EmptyState
          action={
            <Button
              onClick={() => void query.refetch()}
              size="sm"
              variant="secondary"
            >
              Thử lại
            </Button>
          }
          className="min-h-28"
          role="alert"
          title="Không thể tải thương hiệu"
        />
      ) : !brands.length && !hasNextPage ? (
        <EmptyState
          className="min-h-28"
          title="Chưa có thương hiệu có sản phẩm"
        />
      ) : (
        <CarouselContent className="-ml-3">
          {brands.map((brand) => (
            <CarouselItem className={SLIDE_CLASS_NAME} key={brand.id}>
              <HomeBrandCard brand={brand} />
            </CarouselItem>
          ))}
          {hasNextPage ? (
            <CarouselItem className={SLIDE_CLASS_NAME} key="more">
              <div
                className="flex h-28 flex-col items-center justify-center gap-2 rounded border border-border px-3 text-center"
                role={isFetchNextPageError ? "alert" : "status"}
              >
                {isFetchNextPageError ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      Không thể tải thêm thương hiệu.
                    </span>
                    <Button
                      disabled={isFetching}
                      onClick={() =>
                        void fetchNextPage({ cancelRefetch: false })
                      }
                      size="sm"
                      variant="secondary"
                    >
                      Thử lại
                    </Button>
                  </>
                ) : (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-5 animate-spin text-primary motion-reduce:animate-none"
                    />
                    <span className="text-xs text-muted-foreground">
                      Đang tải thương hiệu...
                    </span>
                  </>
                )}
              </div>
            </CarouselItem>
          ) : null}
        </CarouselContent>
      )}
    </Carousel>
  );
}

function HomeBrandCard({ brand }: { brand: CatalogBrand }) {
  const logo = getProductImageSrc(brand.logoUrl);
  return (
    <Link
      aria-label={`Xem thiết bị ${brand.name}`}
      className="group flex h-28 flex-col items-center justify-center gap-2 rounded border border-border bg-background p-3 text-center transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      href={catalogBrowseHref({ brandId: brand.id })}
      prefetch={false}
    >
      {logo ? (
        <>
          <AvatarWithSkeleton
            alt={brand.name}
            className="h-14 w-full rounded-none bg-background"
            fallback={brand.name}
            fallbackClassName="rounded-none bg-background text-sm font-semibold text-primary"
            imageClassName="aspect-auto object-contain"
            loading="lazy"
            src={logo}
          />
        </>
      ) : (
        <span className="line-clamp-2 text-sm font-semibold text-primary">
          {brand.name}
        </span>
      )}
    </Link>
  );
}
