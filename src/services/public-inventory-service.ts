import { z } from "zod";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { parsePublicEquipmentListingListParams } from "@/lib/validations/public-equipment-search";
import { authApiClient } from "@/services/api-client";
import { ApiError } from "@/services/api-error";
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
  const request = parsePublicEquipmentListingListParams(params);
  // This public endpoint accepts optional authentication for recommendations.
  // The BFF forwards the HttpOnly session cookie when present; guests need no token.
  try {
    const response = await authApiClient(
      API_ENDPOINTS.backend.inventory.equipmentListings.publicList(request),
      { signal },
    );
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        items: [],
        page: request.page ?? 1,
        pageSize: request.pageSize ?? 20,
        totalCount: 0,
        totalPages: 1,
      };
    }
    throw error;
  }
}
