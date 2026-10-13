"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  CATALOG_NAVIGATION_HOVER_DELAY,
  CATALOG_NAVIGATION_STALE_TIME,
  catalogNavigationEquipmentParams,
} from "@/config/catalog-navigation";
import {
  fetchCatalogCategories,
  fetchCatalogEquipmentTypes,
} from "@/services/catalog-service";
import type { CatalogNavigationInitialData } from "@/types/catalog-navigation";

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
    initialData:
      category?.id === initialData.categoryId &&
      initialData.equipmentTypes?.success
        ? initialData.equipmentTypes.data
        : undefined,
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
    categories,
    category,
    equipmentTypes,
    selectCategory,
    hoverCategory,
    cancelHover,
  };
}
