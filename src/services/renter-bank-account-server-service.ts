import "server-only";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { getResponseErrorMessage } from "@/services/api-error";
import { serverApi } from "@/services/server-api";
import type { RenterBankAccount } from "@/types/renter-bank-account";

export type InitialRenterBankAccounts = {
  bankAccounts: RenterBankAccount[] | null;
  error: string | null;
};

export async function getRenterBankAccountsForServer(): Promise<InitialRenterBankAccounts> {
  try {
    const response = await serverApi(API_ENDPOINTS.backend.rental.bankAccounts);

    if (!response.ok) {
      return {
        bankAccounts: null,
        error: await getResponseErrorMessage(
          response,
          "Không thể tải sổ tài khoản ngân hàng.",
        ),
      };
    }

    const accounts: unknown = await response.json();
    if (!Array.isArray(accounts)) {
      throw new Error("Dữ liệu sổ tài khoản ngân hàng không hợp lệ.");
    }

    return { bankAccounts: accounts as RenterBankAccount[], error: null };
  } catch {
    return {
      bankAccounts: null,
      error: "Không thể tải sổ tài khoản ngân hàng. Vui lòng thử lại.",
    };
  }
}
