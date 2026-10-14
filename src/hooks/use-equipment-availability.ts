"use client";

import { useQuery } from "@tanstack/react-query";

import { EQUIPMENT_AVAILABILITY_DEBOUNCE_MS } from "@/config/inventory";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { checkPublicEquipmentAvailability } from "@/services/public-inventory-service";
import type { EquipmentAvailabilityCheckRequest } from "@/types/inventory";

export function useEquipmentAvailability(
  listingId: string,
  request: EquipmentAvailabilityCheckRequest | null,
) {
  const requestKey = request ? JSON.stringify(request) : null;
  const debouncedKey = useDebouncedValue(
    requestKey,
    EQUIPMENT_AVAILABILITY_DEBOUNCE_MS,
  );
  const isDebouncing = requestKey !== debouncedKey;
  const query = useQuery({
    // Changing the key immediately also cancels the previous request.
    queryKey: [
      "inventory",
      "public-equipment-listings",
      listingId,
      "availability",
      requestKey,
    ],
    queryFn: ({ signal }) => {
      if (!request) throw new Error("Chưa chọn thông tin thuê hợp lệ.");
      return checkPublicEquipmentAvailability(listingId, request, signal);
    },
    enabled: Boolean(request) && !isDebouncing,
    // Availability can change even for a date range checked earlier.
    staleTime: 0,
    retry: false,
  });
  const isChecking =
    Boolean(request) &&
    (isDebouncing || query.isPending || query.isFetching);
  return {
    isChecking,
    isError: Boolean(request) && !isChecking && query.isError,
    availability: request && !isChecking && query.isSuccess ? query.data : null,
    refetch: query.refetch,
  };
}
