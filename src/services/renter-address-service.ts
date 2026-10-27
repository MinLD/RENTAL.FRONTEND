import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClient, authApiClientJson } from "@/services/api-client";
import { ApiError } from "@/services/api-error";
import type { RenterAddress, SaveRenterAddressRequest } from "@/types/renter-address";

const endpoints = API_ENDPOINTS.backend.rental;

export async function getRenterAddresses(): Promise<RenterAddress[]> {
  try {
    return await authApiClientJson<RenterAddress[]>(endpoints.addresses, { cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export function createRenterAddress(address: SaveRenterAddressRequest) {
  return authApiClientJson<RenterAddress>(endpoints.addresses, {
    method: "POST",
    json: address,
  });
}

export function updateRenterAddress(id: string, address: SaveRenterAddressRequest) {
  return authApiClientJson<RenterAddress>(endpoints.address(id), {
    method: "PATCH",
    json: address,
  });
}

export function deleteRenterAddress(id: string) {
  return authApiClient(endpoints.address(id), { method: "DELETE" });
}

export function setDefaultRenterAddress(id: string) {
  return authApiClientJson<RenterAddress>(endpoints.defaultAddress(id), {
    method: "POST",
  });
}
