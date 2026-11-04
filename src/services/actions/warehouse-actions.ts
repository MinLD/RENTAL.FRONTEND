"use server";

import { revalidatePath } from "next/cache";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  warehouseRequestSchema,
  warehouseResponseSchema,
  type Warehouse,
  type WarehouseRequest,
} from "@/lib/validations/warehouse";
import { ApiError, ApiInputError, type ApiResult } from "@/services/api-error";
import { serverApiJson, serverApiResult } from "@/services/server-api";

export async function getOwnWarehouseAction(): Promise<ApiResult<Warehouse | null>> {
  return serverApiResult(async () => {
    try {
      const response = await serverApiJson<unknown>(
        API_ENDPOINTS.backend.inventory.warehouse.me,
        "Không thể tải địa chỉ kho.",
      );
      return warehouseResponseSchema.parse(response);
    } catch (error) {
      // Only the documented missing-warehouse error allows initial setup.
      if (error instanceof ApiError && error.status === 404) {
        const body = error.responseBody as { code?: unknown; title?: unknown } | undefined;
        if (body?.code === "WAREHOUSE_NOT_FOUND" || body?.title === "WAREHOUSE_NOT_FOUND") {
          return null;
        }
      }
      throw error;
    }
  });
}

export async function saveOwnWarehouseAction(
  request: WarehouseRequest,
): Promise<ApiResult<Warehouse>> {
  return serverApiResult(async () => {
    const parsed = warehouseRequestSchema.safeParse(request);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".");
        (fieldErrors[field] ??= []).push(issue.message);
      }
      throw new ApiInputError("Vui lòng kiểm tra thông tin địa chỉ kho.", fieldErrors);
    }

    const response = await serverApiJson<unknown>(
      API_ENDPOINTS.backend.inventory.warehouse.me,
      "Không thể lưu địa chỉ kho.",
      { method: "PUT", json: parsed.data },
    );
    const updated = warehouseResponseSchema.parse(response);
    revalidatePath("/own/warehouse");
    revalidatePath("/own/account");
    return updated;
  });
}
