"use server";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { createEquipmentListingRequestSchema } from "@/lib/validations/inventory-product";
import { ApiInputError } from "@/services/api-error";
import type { ApiResult } from "@/services/api-error";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import type {
  CreateEquipmentListingRequest,
  EquipmentListing,
  EquipmentListingListResponse,
} from "@/types/inventory";

export async function createOwnEquipmentListingAction(
  request: CreateEquipmentListingRequest,
): Promise<ApiResult<EquipmentListing>> {
  return serverApiResult(async () => {
    const parsed = createEquipmentListingRequestSchema.safeParse(request);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
      }
      throw new ApiInputError(
        "Vui lòng kiểm tra thông tin sản phẩm.",
        fieldErrors,
      );
    }
    return serverApiJson<EquipmentListing>(
      API_ENDPOINTS.backend.inventory.equipmentListings.create,
      "Không thể tạo sản phẩm.",
      { method: "POST", json: parsed.data },
    );
  });
}

export async function getOwnEquipmentListingsAction(
  params: DataTableFetchParams,
): Promise<ApiResult<DataTableFetchResult<EquipmentListing>>> {
  return serverApiResult(async () => {
    const page = Number.isFinite(params.page)
      ? Math.max(1, Math.floor(params.page))
      : 1;
    const pageSize = Number.isFinite(params.pageSize)
      ? Math.min(100, Math.max(1, Math.floor(params.pageSize)))
      : 20;
    const response = await serverApiJson<EquipmentListingListResponse>(
      API_ENDPOINTS.backend.inventory.equipmentListings.list({
        page,
        pageSize,
      }),
      "Không thể tải danh sách sản phẩm.",
    );

    return {
      data: response.items ?? [],
      totalItems: response.totalCount ?? 0,
    };
  });
}
