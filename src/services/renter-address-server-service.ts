import "server-only";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { getResponseErrorMessage } from "@/services/api-error";
import { serverApi } from "@/services/server-api";
import type { RenterAddress } from "@/types/renter-address";

export type InitialRenterAddresses = {
  addresses: RenterAddress[] | null;
  error: string | null;
};

export async function getRenterAddressesForServer(): Promise<InitialRenterAddresses> {
  try {
    const response = await serverApi(API_ENDPOINTS.backend.rental.addresses);

    if (!response.ok) {
      return {
        addresses: null,
        error: await getResponseErrorMessage(response, "Không thể tải sổ địa chỉ."),
      };
    }

    const addresses: unknown = await response.json();
    if (!Array.isArray(addresses)) throw new Error("Dữ liệu sổ địa chỉ không hợp lệ.");

    return { addresses: addresses as RenterAddress[], error: null };
  } catch {
    return { addresses: null, error: "Không thể tải sổ địa chỉ. Vui lòng thử lại." };
  }
}
