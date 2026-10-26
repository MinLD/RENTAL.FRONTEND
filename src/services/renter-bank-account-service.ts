import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import type { RenterBankAccount } from "@/types/renter-bank-account";

const endpoints = API_ENDPOINTS.backend.rental;

export function getRenterBankAccounts() {
  return authApiClientJson<RenterBankAccount[]>(endpoints.bankAccounts, {
    cache: "no-store",
  });
}
