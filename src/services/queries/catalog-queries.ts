import "server-only";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { ApiError, ApiInputError } from "@/services/api-error";
import type { ApiResult } from "@/services/api-error";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import type {
  CatalogBrand,
  CatalogBrandDto,
  CatalogBrandListParams,
  CatalogBrandListResponse,
  CatalogCategoryDetail,
  CatalogCategoryDetailResponse,
  CatalogCategoryListResponse,
  CatalogEquipmentTypeDetail,
  CatalogEquipmentTypeDetailDto,
  CatalogEquipmentTypeListItem,
  CatalogEquipmentTypeListParams,
  CatalogEquipmentTypeListResponse,
  CatalogPagedResult,
  CatalogPublishedSpecSchema,
  CatalogPublishedSpecSchemaResponse,
} from "@/types/catalog";
import {
  normalizeCatalogBrand,
  normalizeCatalogBrandList,
  normalizeCatalogCategoryList,
  normalizeCatalogEquipmentTypeDetail,
  normalizeCatalogEquipmentTypeList,
  normalizeCatalogPublishedSpecSchema,
} from "@/utils/catalog";

export async function getCatalogBrands(
  params: CatalogBrandListParams = {},
): Promise<ApiResult<CatalogPagedResult<CatalogBrand>>> {
  return serverApiResult(async () => {
    try {
      const response = await serverApiJson<CatalogBrandListResponse>(
        API_ENDPOINTS.backend.catalog.brands.list(params),
        "Không thể tải danh sách thương hiệu.",
      );
      return normalizeCatalogBrandList(response, params);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { data: [], page: params.page ?? 1, pageSize: params.pageSize ?? 20, totalItems: 0, totalPages: 1 };
      }
      throw error;
    }
  });
}

export async function getCatalogCategories(): Promise<
  ApiResult<CatalogPagedResult<CatalogCategoryDetail>>
> {
  return serverApiResult(async () => {
    try {
      const response = await serverApiJson<
        CatalogCategoryDetailResponse[] | CatalogCategoryListResponse
      >(
        API_ENDPOINTS.backend.catalog.categories.list(),
        "Không thể tải danh sách danh mục.",
      );
      return normalizeCatalogCategoryList(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { data: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };
      }
      throw error;
    }
  });
}

export async function getCatalogEquipmentTypes(
  params: CatalogEquipmentTypeListParams = {},
): Promise<ApiResult<CatalogPagedResult<CatalogEquipmentTypeListItem>>> {
  return serverApiResult(async () => {
    try {
      const response = await serverApiJson<CatalogEquipmentTypeListResponse>(
        API_ENDPOINTS.backend.catalog.equipmentTypes.list(params),
        "Không thể tải danh sách loại thiết bị.",
      );
      return normalizeCatalogEquipmentTypeList(response, params);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { data: [], page: params.page ?? 1, pageSize: params.pageSize ?? 20, totalItems: 0, totalPages: 1 };
      }
      throw error;
    }
  });
}

function assertCatalogId(id: string, message: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    throw new ApiInputError(message);
}

export async function getCatalogBrand(
  id: string,
): Promise<ApiResult<CatalogBrand>> {
  return serverApiResult(async () => {
    assertCatalogId(id, "ID thương hiệu không hợp lệ.");
    const response = await serverApiJson<CatalogBrandDto>(
      API_ENDPOINTS.backend.catalog.brands.detail(id),
      "Không thể tải chi tiết thương hiệu.",
    );
    return normalizeCatalogBrand(response);
  });
}

export async function getCatalogEquipmentType(
  id: string,
): Promise<ApiResult<CatalogEquipmentTypeDetail>> {
  return serverApiResult(async () => {
    assertCatalogId(id, "ID loại thiết bị không hợp lệ.");
    const response = await serverApiJson<CatalogEquipmentTypeDetailDto>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.detail(id),
      "Không thể tải chi tiết loại thiết bị.",
    );
    return normalizeCatalogEquipmentTypeDetail(response);
  });
}

export async function getCatalogEquipmentTypeSchemaVersion(
  equipmentTypeId: string,
  version: number,
): Promise<ApiResult<CatalogPublishedSpecSchema>> {
  return serverApiResult(async () => {
    assertCatalogId(equipmentTypeId, "ID loại thiết bị không hợp lệ.");
    if (!Number.isInteger(version) || version <= 0)
      throw new ApiInputError("Version schema không hợp lệ.");
    const response = await serverApiJson<CatalogPublishedSpecSchemaResponse>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.publishedSchemaVersion(
        equipmentTypeId,
        version,
      ),
      "Không thể tải schema version của loại thiết bị.",
    );
    return normalizeCatalogPublishedSpecSchema(response);
  });
}
