import "server-only";

import { z } from "zod";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { parsePublicEquipmentListingListParams } from "@/lib/validations/public-equipment-search";
import { ApiInputError } from "@/services/api-error";
import type { ApiResult } from "@/services/api-error";
import {
  assertInventoryId,
  parseInventoryRequest,
} from "@/services/inventory-validation";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import type {
  EquipmentListing,
  EquipmentListingCalendar,
  InventoryCalendarRange,
  PublicEquipmentListingListParams,
  PublicEquipmentListingDetail,
  PublicEquipmentListingListResponse,
} from "@/types/inventory";

export async function getPublicEquipmentListing(
  id: string,
): Promise<ApiResult<PublicEquipmentListingDetail>> {
  return serverApiResult(async () => {
    assertInventoryId(id);
    return serverApiJson<PublicEquipmentListingDetail>(
      API_ENDPOINTS.backend.inventory.equipmentListings.publicDetail(id),
      "Không thể tải chi tiết thiết bị.",
    );
  });
}

export async function getPublicEquipmentListings(
  params: PublicEquipmentListingListParams = {},
): Promise<ApiResult<PublicEquipmentListingListResponse>> {
  return serverApiResult(async () => {
    const request = parsePublicEquipmentListingListParams(params);
    return serverApiJson<PublicEquipmentListingListResponse>(
      API_ENDPOINTS.backend.inventory.equipmentListings.publicList(request),
      "Không thể tải danh sách thiết bị.",
    );
  });
}

export async function getOwnEquipmentListing(
  id: string,
): Promise<ApiResult<EquipmentListing>> {
  return serverApiResult(async () => {
    assertInventoryId(id);
    return serverApiJson<EquipmentListing>(
      API_ENDPOINTS.backend.inventory.equipmentListings.detail(id),
      "Không thể tải chi tiết sản phẩm.",
    );
  });
}

export async function getOwnEquipmentListingCalendar(
  id: string,
  range: InventoryCalendarRange,
): Promise<ApiResult<EquipmentListingCalendar>> {
  return serverApiResult(async () => {
    assertInventoryId(id);
    const dateSchema = z.iso.date();
    const parsed = {
      from: parseInventoryRequest(dateSchema, range.from),
      to: parseInventoryRequest(dateSchema, range.to),
    };
    if (parsed.to < parsed.from)
      throw new ApiInputError("Ngày kết thúc phải từ ngày bắt đầu trở đi.");
    return serverApiJson<EquipmentListingCalendar>(
      API_ENDPOINTS.backend.inventory.equipmentListings.calendar(id, parsed),
      "Không thể tải lịch sử dụng sản phẩm.",
    );
  });
}
