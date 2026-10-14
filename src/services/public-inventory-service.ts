import { z } from "zod";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClient } from "@/services/api-client";
import type {
  EquipmentAvailabilityCheckRequest,
  EquipmentAvailabilityCheckResponse,
  PublicEquipmentListingListParams,
  PublicEquipmentListingListResponse,
} from "@/types/inventory";

const equipmentAvailabilityResponseSchema = z.object({
  listingId: z.uuid(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  requestedQuantity: z.number().int().positive(),
  availableQuantity: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
});

export async function checkPublicEquipmentAvailability(
  listingId: string,
  request: EquipmentAvailabilityCheckRequest,
  signal?: AbortSignal,
): Promise<EquipmentAvailabilityCheckResponse> {
  const response = await authApiClient(
    API_ENDPOINTS.backend.inventory.equipmentListings.publicAvailabilityCheck(
      listingId,
    ),
    { method: "POST", json: request, signal },
  );
  const result = equipmentAvailabilityResponseSchema.parse(
    await response.json(),
  );
  if (
    result.listingId !== listingId ||
    result.startDate !== request.startDate ||
    result.endDate !== request.endDate ||
    result.requestedQuantity !== request.requestedQuantity ||
    (result.isAvailable && result.availableQuantity < request.requestedQuantity)
  ) {
    throw new Error("Kết quả kiểm tra không khớp với yêu cầu thuê.");
  }
  return result;
}

export async function fetchPublicEquipmentListings(
  params: PublicEquipmentListingListParams,
  signal?: AbortSignal,
): Promise<PublicEquipmentListingListResponse> {
  const response = await authApiClient(
    API_ENDPOINTS.backend.inventory.equipmentListings.publicList(params),
    { signal },
  );
  return response.json();
}
