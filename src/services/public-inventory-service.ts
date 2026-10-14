import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClient } from "@/services/api-client";
import type {
  PublicEquipmentListingListParams,
  PublicEquipmentListingListResponse,
} from "@/types/inventory";

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
