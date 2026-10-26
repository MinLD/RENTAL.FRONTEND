"use server";

import { revalidatePath } from "next/cache";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { renterBankAccountSchema } from "@/lib/validations/renter-bank-account";
import { ApiInputError, type ApiResult } from "@/services/api-error";
import {
  serverApiJson,
  serverApiOk,
  serverApiResult,
} from "@/services/server-api";
import type {
  CreateRenterBankAccountRequest,
  RenterBankAccount,
} from "@/types/renter-bank-account";

const endpoints = API_ENDPOINTS.backend.rental;

export async function createRenterBankAccountAction(
  request: CreateRenterBankAccountRequest,
): Promise<ApiResult<RenterBankAccount>> {
  return serverApiResult(async () => {
    const parsed = renterBankAccountSchema.safeParse(request);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".");
        (fieldErrors[field] ??= []).push(issue.message);
      }
      throw new ApiInputError(
        "Vui lòng kiểm tra lại thông tin tài khoản ngân hàng.",
        fieldErrors,
      );
    }

    const created = await serverApiJson<RenterBankAccount>(
      endpoints.bankAccounts,
      "Không thể thêm tài khoản ngân hàng.",
      {
        method: "POST",
        json: parsed.data,
      },
    );

    revalidatePath("/account");
    return created;
  });
}

export async function deleteRenterBankAccountAction(
  id: string,
): Promise<ApiResult<void>> {
  return serverApiResult(async () => {
    await serverApiOk(
      endpoints.bankAccount(id),
      "Không thể xóa tài khoản ngân hàng.",
      { method: "DELETE" },
    );
    revalidatePath("/account");
  });
}

export async function setDefaultRenterBankAccountAction(
  id: string,
): Promise<ApiResult<RenterBankAccount>> {
  return serverApiResult(async () => {
    const result = await serverApiJson<RenterBankAccount>(
      endpoints.defaultBankAccount(id),
      "Không thể đặt làm tài khoản mặc định.",
      { method: "POST" },
    );
    revalidatePath("/account");
    return result;
  });
}
