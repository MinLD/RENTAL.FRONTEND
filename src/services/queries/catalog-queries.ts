import "server-only";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { ApiInputError } from "@/services/api-error";
import type { ApiResult } from "@/services/api-error";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import type {
  CatalogBrand,
  CatalogBrandDto,
  CatalogEquipmentTypeDetail,
  CatalogEquipmentTypeDetailDto,
} from "@/types/catalog";
import {
  normalizeCatalogBrand,
  normalizeCatalogEquipmentTypeDetail,
} from "@/utils/catalog";

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
