"use client";

import { useQuery } from "@tanstack/react-query";

import { EQUIPMENT_SEARCH_PAGE_SIZE, EQUIPMENT_SEARCH_STALE_TIME } from "@/config/equipment-search";
import { fetchPublicEquipmentListings } from "@/services/public-inventory-service";

export function useEquipmentRecommendations(userId: string | null, isOpen: boolean) {
  return useQuery({
    queryKey: ["inventory", "public-equipment-listings", "recommended", userId],
    queryFn: ({ signal }) => fetchPublicEquipmentListings({
      sort: "recommended",
      page: 1,
      pageSize: EQUIPMENT_SEARCH_PAGE_SIZE,
    }, signal),
    enabled: isOpen,
    staleTime: EQUIPMENT_SEARCH_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
