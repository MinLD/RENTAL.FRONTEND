"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { HOME_PRODUCTS_STALE_TIME } from "@/config/homepage";
import { fetchCatalogEquipmentTypes } from "@/services/catalog-service";
import type { CatalogCategoryDetail } from "@/types/catalog";
import { hasCatalogListings } from "@/utils/catalog";
import { HomeProductCarousel } from "./home-product-carousel";
import { HomeCategoryProductsSkeleton } from "./home-products-skeleton";

export function HomeCategoryProducts({ category }: { category: CatalogCategoryDetail }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible || !elementRef.current) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px 0px" });
    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={elementRef}>
      {isVisible ? <HomeCategoryProductsContent category={category} /> : (
        <HomeCategoryProductsSkeleton name={category.name} />
      )}
    </div>
  );
}

async function fetchCategoryEquipmentTypes(categoryId: string, signal: AbortSignal) {
  const params = { categoryId, pageSize: 100, sort: "name_asc" };
  const first = await fetchCatalogEquipmentTypes({ ...params, page: 1 }, signal);
  const remaining = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
      fetchCatalogEquipmentTypes({ ...params, page: index + 2 }, signal),
    ),
  );
  return [...first.data, ...remaining.flatMap((page) => page.data)]
    .filter((type) => type.id && hasCatalogListings(type));
}

function HomeCategoryProductsContent({ category }: { category: CatalogCategoryDetail }) {
  const equipmentTypes = useQuery({
    queryKey: ["home", "equipment-types", category.id],
    queryFn: ({ signal }) => fetchCategoryEquipmentTypes(category.id, signal),
    staleTime: HOME_PRODUCTS_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return (
    <HomeProductCarousel
      category={category}
      equipmentTypes={equipmentTypes.data ?? []}
      equipmentTypesFailed={equipmentTypes.isError}
      equipmentTypesLoading={equipmentTypes.isPending}
      onRetryEquipmentTypes={() => void equipmentTypes.refetch()}
    />
  );
}
