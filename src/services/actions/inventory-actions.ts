"use server";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  createEquipmentListingRequestSchema,
  equipmentListingRentalRateSchema,
  updateEquipmentListingRequestSchema,
  createInventoryAssetRequestSchema,
  updateInventoryAssetRequestSchema,
  updateInventoryAssetBookingsRequestSchema,
  createInventoryCalendarBlockRequestSchema,
} from "@/lib/validations/inventory-product";
import { ApiError } from "@/services/api-error";
import type { ApiResult } from "@/services/api-error";
import {
  serverApiJson,
  serverApiOk,
  serverApiResult,
} from "@/services/server-api";
import {
  assertInventoryId as assertListingId,
  parseInventoryRequest as parseRequest,
} from "@/services/inventory-validation";
import {
  getOwnEquipmentListing,
  getOwnEquipmentListingCalendar,
} from "@/services/queries/inventory-queries";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import type {
  CreateEquipmentListingRequest,
  EquipmentListing,
  EquipmentListingListResponse,
  EquipmentListingFilters,
  EquipmentListingRentalRate,
  UpdateEquipmentListingRequest,
  InventoryAsset,
  InventoryAssetListResponse,
  InventoryAssetCalendar,
  CreateInventoryAssetRequest,
  UpdateInventoryAssetRequest,
  UpdateInventoryAssetBookingsRequest,
  CreateInventoryCalendarBlockRequest,
  InventoryCalendarBlock,
  EquipmentListingCalendar,
  InventoryCalendarRange,
} from "@/types/inventory";

function getPagination(params: DataTableFetchParams) {
  return {
    page: Number.isFinite(params.page)
      ? Math.max(1, Math.floor(params.page))
      : 1,
    pageSize: Number.isFinite(params.pageSize)
      ? Math.min(100, Math.max(1, Math.floor(params.pageSize)))
      : 20,
  };
}

export async function getOwnEquipmentListingAssetsAction(
  id: string,
  params: DataTableFetchParams,
): Promise<ApiResult<DataTableFetchResult<InventoryAsset>>> {
  return serverApiResult(async () => {
    assertListingId(id);
    try {
      const result = await serverApiJson<InventoryAssetListResponse>(
        API_ENDPOINTS.backend.inventory.equipmentListings.assets(
          id,
          getPagination(params),
        ),
        "Không thể tải danh sách máy vật lý.",
      );
      return { data: result.items ?? [], totalItems: result.totalCount ?? 0 };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { data: [], totalItems: 0 };
      }
      throw error;
    }
  });
}

export async function createOwnInventoryAssetAction(
  id: string,
  request: CreateInventoryAssetRequest,
): Promise<ApiResult<InventoryAsset>> {
  return serverApiResult(async () => {
    assertListingId(id);
    return serverApiJson<InventoryAsset>(
      API_ENDPOINTS.backend.inventory.equipmentListings.assets(id),
      "Không thể thêm máy vật lý.",
      {
        method: "POST",
        json: parseRequest(createInventoryAssetRequestSchema, request),
      },
    );
  });
}

export async function getOwnInventoryAssetAction(
  id: string,
): Promise<ApiResult<InventoryAsset>> {
  return serverApiResult(async () => {
    assertListingId(id);
    return serverApiJson<InventoryAsset>(
      API_ENDPOINTS.backend.inventory.assets.detail(id),
      "Không thể tải chi tiết máy vật lý.",
    );
  });
}

export async function updateOwnInventoryAssetAction(
  id: string,
  request: UpdateInventoryAssetRequest,
): Promise<ApiResult<InventoryAsset>> {
  return serverApiResult(async () => {
    assertListingId(id);
    return serverApiJson<InventoryAsset>(
      API_ENDPOINTS.backend.inventory.assets.detail(id),
      "Không thể cập nhật máy vật lý.",
      {
        method: "PATCH",
        json: parseRequest(updateInventoryAssetRequestSchema, request),
      },
    );
  });
}

export async function updateOwnInventoryAssetBookingsAction(
  id: string,
  request: UpdateInventoryAssetBookingsRequest,
): Promise<ApiResult<InventoryAsset>> {
  return serverApiResult(async () => {
    assertListingId(id);
    return serverApiJson<InventoryAsset>(
      API_ENDPOINTS.backend.inventory.assets.acceptingBookings(id),
      "Không thể cập nhật trạng thái nhận đặt thuê.",
      {
        method: "PATCH",
        json: parseRequest(updateInventoryAssetBookingsRequestSchema, request),
      },
    );
  });
}

export async function getOwnInventoryAssetCalendarAction(
  id: string,
): Promise<ApiResult<InventoryAssetCalendar>> {
  return serverApiResult(async () => {
    assertListingId(id);
    return serverApiJson<InventoryAssetCalendar>(
      API_ENDPOINTS.backend.inventory.assets.calendar(id),
      "Không thể tải lịch của máy vật lý.",
    );
  });
}

export async function getOwnEquipmentListingCalendarAction(
  id: string,
  range: InventoryCalendarRange,
): Promise<ApiResult<EquipmentListingCalendar>> {
  return getOwnEquipmentListingCalendar(id, range);
}

export async function createOwnInventoryCalendarBlockAction(
  assetId: string,
  request: CreateInventoryCalendarBlockRequest,
): Promise<ApiResult<InventoryCalendarBlock>> {
  return serverApiResult(async () => {
    assertListingId(assetId);
    return serverApiJson<InventoryCalendarBlock>(
      API_ENDPOINTS.backend.inventory.assets.calendarBlocks(assetId),
      "Không thể tạo khoảng chặn lịch.",
      {
        method: "POST",
        json: parseRequest(createInventoryCalendarBlockRequestSchema, request),
      },
    );
  });
}

export async function deleteOwnInventoryCalendarBlockAction(
  assetId: string,
  blockId: string,
): Promise<ApiResult<null>> {
  return serverApiResult(async () => {
    assertListingId(assetId);
    assertListingId(blockId);
    await serverApiOk(
      API_ENDPOINTS.backend.inventory.assets.calendarBlock(assetId, blockId),
      "Không thể xóa khoảng chặn lịch.",
      { method: "DELETE" },
    );
    return null;
  });
}

export async function getOwnEquipmentListingAction(
  id: string,
): Promise<ApiResult<EquipmentListing>> {
  return getOwnEquipmentListing(id);
}

export async function updateOwnEquipmentListingAction(
  id: string,
  request: UpdateEquipmentListingRequest,
): Promise<ApiResult<EquipmentListing>> {
  return serverApiResult(async () => {
    assertListingId(id);
    return serverApiJson<EquipmentListing>(
      API_ENDPOINTS.backend.inventory.equipmentListings.detail(id),
      "Không thể cập nhật thông tin sản phẩm.",
      {
        method: "PATCH",
        json: parseRequest(updateEquipmentListingRequestSchema, request),
      },
    );
  });
}

export async function updateOwnEquipmentListingRentalRateAction(
  id: string,
  request: EquipmentListingRentalRate,
): Promise<ApiResult<EquipmentListingRentalRate>> {
  return serverApiResult(async () => {
    assertListingId(id);
    return serverApiJson<EquipmentListingRentalRate>(
      API_ENDPOINTS.backend.inventory.equipmentListings.rentalRate(id),
      "Không thể cập nhật giá thuê.",
      {
        method: "PUT",
        json: parseRequest(equipmentListingRentalRateSchema, request),
      },
    );
  });
}

export async function createOwnEquipmentListingAction(
  request: CreateEquipmentListingRequest,
): Promise<ApiResult<EquipmentListing>> {
  return serverApiResult(async () => {
    return serverApiJson<EquipmentListing>(
      API_ENDPOINTS.backend.inventory.equipmentListings.create,
      "Không thể tạo sản phẩm.",
      {
        method: "POST",
        json: parseRequest(createEquipmentListingRequestSchema, request),
      },
    );
  });
}

export async function getOwnEquipmentListingsAction(
  params: DataTableFetchParams<EquipmentListingFilters>,
): Promise<ApiResult<DataTableFetchResult<EquipmentListing>>> {
  return serverApiResult(async () => {
    const page = Number.isFinite(params.page)
      ? Math.max(1, Math.floor(params.page))
      : 1;
    const pageSize = Number.isFinite(params.pageSize)
      ? Math.min(100, Math.max(1, Math.floor(params.pageSize)))
      : 20;
    const filters = params.filters ?? {};
    if (filters.equipmentTypeId) assertListingId(filters.equipmentTypeId);
    if (filters.brandId) assertListingId(filters.brandId);
    const status =
      filters.status === undefined
        ? undefined
        : parseRequest(
            updateEquipmentListingRequestSchema.shape.status,
            filters.status,
          );
    try {
      const response = await serverApiJson<EquipmentListingListResponse>(
        API_ENDPOINTS.backend.inventory.equipmentListings.list({
          page,
          pageSize,
          q: params.keyword,
          equipmentTypeId: filters.equipmentTypeId || undefined,
          brandId: filters.brandId || undefined,
          status,
        }),
        "Không thể tải danh sách sản phẩm.",
      );

      return {
        data: response.items ?? [],
        totalItems: response.totalCount ?? 0,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { data: [], totalItems: 0 };
      }
      throw error;
    }
  });
}
