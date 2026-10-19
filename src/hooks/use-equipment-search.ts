"use client";

import { useQuery } from "@tanstack/react-query";

import {
  EQUIPMENT_SEARCH_DEBOUNCE_MS,
  EQUIPMENT_SEARCH_MIN_LENGTH,
  EQUIPMENT_SEARCH_PAGE_SIZE,
  EQUIPMENT_SEARCH_STALE_TIME,
} from "@/config/equipment-search";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchPublicEquipmentListings } from "@/services/public-inventory-service";
import { usePublicArea } from "@/providers/public-area-provider";
import { publicAreaParams } from "@/lib/locations/public-area";

export function useEquipmentSearch(keyword: string, isOpen: boolean) {
  const { area, isReady } = usePublicArea();
  const areaParams = publicAreaParams(area);
  const trimmedKeyword = keyword.trim();
  const debouncedKeyword = useDebouncedValue(
    trimmedKeyword,
    EQUIPMENT_SEARCH_DEBOUNCE_MS,
  );
  const isDebouncing = trimmedKeyword !== debouncedKeyword;
  const canSearch = trimmedKeyword.length >= EQUIPMENT_SEARCH_MIN_LENGTH;
  const query = useQuery({
    queryKey: [
      "inventory",
      "public-equipment-listings",
      "suggestions",
      debouncedKeyword,
      areaParams.provinceCode,
      areaParams.wardCode,
    ],
    queryFn: ({ signal }) =>
      fetchPublicEquipmentListings(
        { ...areaParams, q: debouncedKeyword, page: 1, pageSize: EQUIPMENT_SEARCH_PAGE_SIZE },
        signal,
      ),
    enabled: isReady && isOpen && canSearch && !isDebouncing,
    staleTime: EQUIPMENT_SEARCH_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: false,
  });
  return {
    ...query,
    canSearch,
    isLoadingSuggestions: canSearch && (isDebouncing || query.isPending),
    // Never show an earlier keyword's results while a new query is debouncing.
    suggestions:
      !isDebouncing && canSearch && !query.isError
        ? (query.data?.items ?? [])
        : [],
  };
}
