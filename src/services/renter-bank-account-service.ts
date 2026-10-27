import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import { ApiError } from "@/services/api-error";
import type {
  RenterBankAccount,
  UpdateRenterBankAccountRequest,
} from "@/types/renter-bank-account";

const endpoints = API_ENDPOINTS.backend.rental;

export async function getRenterBankAccounts(): Promise<RenterBankAccount[]> {
  try {
    return await authApiClientJson<RenterBankAccount[]>(endpoints.bankAccounts, {
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export function updateRenterBankAccount(
  id: string,
  request: UpdateRenterBankAccountRequest,
) {
  return authApiClientJson<RenterBankAccount>(endpoints.bankAccount(id), {
    method: "PATCH",
    json: request,
  });
}
