"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronRight, LoaderCircle } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselProps } from "@/components/ui/carousel";
import { HOME_PRODUCT_IMAGE_SIZES, HOME_PRODUCTS_PAGE_SIZE, HOME_PRODUCTS_STALE_TIME } from "@/config/homepage";
import { productBrowseHref } from "@/config/product-browse";
import { fetchPublicEquipmentListings } from "@/services/public-inventory-service";
import type { CatalogCategoryDetail, CatalogEquipmentTypeListItem } from "@/types/catalog";
import { HomeProductsSkeleton } from "./home-products-skeleton";

type HomeProductCarouselProps = {
  category: CatalogCategoryDetail;
  equipmentTypes: CatalogEquipmentTypeListItem[];
  equipmentTypesFailed: boolean;
  equipmentTypesLoading: boolean;
  onRetryEquipmentTypes: () => void;
};
type CarouselApi = Parameters<NonNullable<CarouselProps["setApi"]>>[0];

const SLIDE_CLASS_NAME = "basis-4/5 sm:basis-1/3 lg:basis-1/4";
const ARROW_CLASS_NAME = "static size-8 translate-y-0 rounded border-border bg-background text-foreground shadow-none backdrop-blur-none hover:bg-primary hover:text-primary-foreground";

export function HomeProductCarousel(props: HomeProductCarouselProps) {
  const [equipmentTypeId, setEquipmentTypeId] = useState<string>();
  return (
    <HomeFilteredProductCarousel
      {...props}
      equipmentTypeId={equipmentTypeId}
      key={equipmentTypeId ?? "all"}
      onSelectType={setEquipmentTypeId}
    />
  );
}

function HomeFilteredProductCarousel({
  category,
  equipmentTypes,
  equipmentTypesFailed,
  equipmentTypesLoading,
  onRetryEquipmentTypes,
  equipmentTypeId,
  onSelectType,
}: HomeProductCarouselProps & {
  equipmentTypeId?: string;
  onSelectType: (id: string | undefined) => void;
}) {
  const titleId = useId();
  const [api, setApi] = useState<CarouselApi>();
  const query = useInfiniteQuery({
    queryKey: ["home", "products", category.id, equipmentTypeId],
    queryFn: ({ pageParam, signal }) => fetchPublicEquipmentListings({
      categoryId: category.id,
      equipmentTypeId,
      page: pageParam,
      pageSize: HOME_PRODUCTS_PAGE_SIZE,
      sort: "created_desc",
    }, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.items.length > 0 && lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: HOME_PRODUCTS_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const { fetchNextPage, hasNextPage, isFetching, isFetchNextPageError } = query;
  const products = Array.from(new Map(query.data?.pages.flatMap((page) => page.items).map((product) => [product.id, product])).values());
  const typeNames = new Map(equipmentTypes.map((type) => [type.id, type.name]));
  const browseHref = productBrowseHref({ categoryId: category.id, equipmentTypeId });

  useEffect(() => {
    if (!api || !hasNextPage || isFetching || isFetchNextPageError || !products.length) return;
    // Fetch only when the last loaded product (or the loading slide) is visible.
    // Re-check after Embla measures appended slides, without resetting its position.
    const loadNext = () => {
      if (api.slidesInView().some((index) => index >= products.length - 1)) {
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
  }, [api, fetchNextPage, hasNextPage, isFetching, isFetchNextPageError, products.length]);

  return (
    <section aria-labelledby={titleId} className="mt-8 sm:mt-10">
      <Carousel aria-label={`Sản phẩm ${category.name}`} opts={{ align: "start", loop: false }} setApi={setApi}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="border-l-3 border-primary pl-2.5 text-xs font-bold uppercase sm:text-sm" id={titleId}>{category.name}</h2>
          <div className="flex shrink-0 gap-2">
            <CarouselPrevious aria-label={`Sản phẩm trước trong ${category.name}`} className={ARROW_CLASS_NAME} />
            <CarouselNext aria-label={`Sản phẩm tiếp theo trong ${category.name}`} className={ARROW_CLASS_NAME} />
          </div>
        </div>
        <div aria-busy={equipmentTypesLoading} aria-label={`Lọc loại thiết bị trong ${category.name}`} className="mb-4 flex gap-2 overflow-x-auto pb-1" role="group">
          {[{ id: "", name: "Tất cả" }, ...equipmentTypes].map((type) => (
            <Button
              aria-pressed={(equipmentTypeId ?? "") === type.id}
              className="shrink-0"
              key={type.id}
              onClick={() => onSelectType(type.id || undefined)}
              size="sm"
              type="button"
              variant={(equipmentTypeId ?? "") === type.id ? "primary" : "secondary"}
            >{type.name}</Button>
          ))}
          {equipmentTypesLoading ? <>
            <Skeleton aria-hidden="true" className="h-8 w-32 shrink-0" />
            <Skeleton aria-hidden="true" className="h-8 w-32 shrink-0" />
          </> : null}
        </div>
        {equipmentTypesFailed ? (
          <p className="mb-3 text-xs text-muted-foreground" role="status">
            Không thể tải bộ lọc loại thiết bị. <button className="cursor-pointer text-primary underline" onClick={onRetryEquipmentTypes} type="button">Thử lại</button>
          </p>
        ) : null}
        {query.isPending ? <HomeProductsSkeleton /> : !products.length ? (
          <EmptyState
            className="min-h-56"
            title={query.isError ? "Không thể tải sản phẩm" : "Chưa có sản phẩm"}
            description={query.isError ? "Vui lòng thử tải lại sản phẩm." : "Loại thiết bị này hiện chưa có sản phẩm."}
            role={query.isError ? "alert" : "status"}
            action={query.isError ? <Button onClick={() => void query.refetch()} size="sm" variant="secondary">Thử lại</Button> : undefined}
          />
        ) : (
          <CarouselContent>
            {products.map((product) => (
              <CarouselItem className={SLIDE_CLASS_NAME} key={product.id}>
                <ProductCard equipmentTypeName={typeNames.get(product.equipmentTypeId)} imageSizes={HOME_PRODUCT_IMAGE_SIZES} product={product} />
              </CarouselItem>
            ))}
            <CarouselItem className={SLIDE_CLASS_NAME} key="more">
              {hasNextPage ? (
                <div className="flex h-full min-h-80 flex-col items-center justify-center gap-3 rounded border border-border p-4 text-center" role={isFetchNextPageError ? "alert" : "status"}>
                  {isFetchNextPageError ? <>
                    <p className="text-sm text-muted-foreground">Không thể tải thêm sản phẩm.</p>
                    <Button disabled={isFetching} onClick={() => void fetchNextPage({ cancelRefetch: false })} size="sm" variant="secondary">Thử lại</Button>
                  </> : <>
                    <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary motion-reduce:animate-none" />
                    <span className="text-xs text-muted-foreground">Đang tải thêm sản phẩm...</span>
                  </>}
                </div>
              ) : (
                <Link className="group flex h-full min-h-80 flex-col items-center justify-center gap-3 rounded border border-border p-4 text-center hover:border-primary focus-visible:outline-2 focus-visible:outline-primary" href={browseHref} prefetch={false}>
                  <ChevronRight aria-hidden="true" className="size-8 text-primary" />
                  <span className="text-sm font-semibold text-primary">Xem tất cả</span>
                  <span className="text-xs text-muted-foreground">{equipmentTypes.find((type) => type.id === equipmentTypeId)?.name ?? category.name}</span>
                </Link>
              )}
            </CarouselItem>
          </CarouselContent>
        )}
      </Carousel>
    </section>
  );
}
