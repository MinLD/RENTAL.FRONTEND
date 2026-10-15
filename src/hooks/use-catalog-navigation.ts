"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  CATALOG_NAVIGATION_HOVER_DELAY,
  CATALOG_NAVIGATION_BRAND_PARAMS,
  CATALOG_NAVIGATION_STALE_TIME,
  catalogNavigationEquipmentParams,
} from "@/config/catalog-navigation";
import {
  fetchCatalogCategories,
  fetchCatalogBrands,
  fetchCatalogEquipmentTypes,
} from "@/services/catalog-service";
import type { CatalogNavigationInitialData } from "@/types/catalog-navigation";
import type { CatalogPagedResult } from "@/types/catalog";
import { hasCatalogListings } from "@/utils/catalog";

function withListings<T extends { listingCount?: number }>(result: CatalogPagedResult<T>) {
  return { ...result, data: result.data.filter(hasCatalogListings) };
}

export function useCatalogNavigation(
  initialData: CatalogNavigationInitialData,
  isOpen: boolean,
) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialData.categoryId,
  );
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const options = {
    staleTime: CATALOG_NAVIGATION_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: isOpen,
    initialDataUpdatedAt: initialData.updatedAt,
  } as const;
  const categories = useQuery({
    ...options,
    queryKey: ["catalog", "categories"],
    queryFn: ({ signal }) => fetchCatalogCategories(signal),
    select: withListings,
    initialData: initialData.categories.success
      ? initialData.categories.data
      : undefined,
  });
  // If the category SSR request failed, select the first category when a
  // client retry succeeds. No dependent request is sent without a real ID.
  const category =
    categories.data?.data.find((item) => item.id === selectedCategoryId) ??
    categories.data?.data[0];
  const params = catalogNavigationEquipmentParams(category?.id ?? "");
  const equipmentTypes = useQuery({
    ...options,
    enabled: isOpen && Boolean(category?.id),
    queryKey: ["catalog", "equipment-types", params],
    queryFn: ({ signal }) => fetchCatalogEquipmentTypes(params, signal),
    select: withListings,
    initialData:
      category?.id === initialData.categoryId &&
      initialData.equipmentTypes?.success
        ? initialData.equipmentTypes.data
        : undefined,
  });

  const brands = useQuery({
    ...options,
    queryKey: ["catalog", "brands", CATALOG_NAVIGATION_BRAND_PARAMS],
    queryFn: ({ signal }) => fetchCatalogBrands(CATALOG_NAVIGATION_BRAND_PARAMS, signal),
    select: withListings,
    initialData: initialData.brands.success ? initialData.brands.data : undefined,
  });

  function cancelHover() {
    if (hoverTimer.current !== null) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }

  function selectCategory(id: string) {
    cancelHover();
    setSelectedCategoryId(id);
  }

  function hoverCategory(id: string) {
    cancelHover();
    hoverTimer.current = setTimeout(() => {
      selectCategory(id);
    }, CATALOG_NAVIGATION_HOVER_DELAY);
  }

  useEffect(() => {
    if (!isOpen && hoverTimer.current !== null) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    return () => {
      if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
    };
  }, [isOpen]);

  return {
    brands,
    categories,
    category,
    equipmentTypes,
    selectCategory,
    hoverCategory,
    cancelHover,
  };
}
