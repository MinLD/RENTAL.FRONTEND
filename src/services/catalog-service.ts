import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClient } from "@/services/api-client";
import type {
  CatalogCategoryDetailResponse,
  CatalogCategoryListResponse,
  CatalogEquipmentTypeListParams,
  CatalogEquipmentTypeListResponse,
} from "@/types/catalog";
import {
  normalizeCatalogCategoryList,
  normalizeCatalogEquipmentTypeList,
} from "@/utils/catalog";

// The public catalog uses the existing same-origin BFF. Parse JSON even when
// the backend labels the category response as text/plain in its API contract.
export async function fetchCatalogCategories(signal?: AbortSignal) {
  const response = await authApiClient(
    API_ENDPOINTS.backend.catalog.categories.list(),
    { signal },
  );
  const data = (await response.json()) as
    CatalogCategoryDetailResponse[] | CatalogCategoryListResponse;
  return normalizeCatalogCategoryList(data);
}

export async function fetchCatalogEquipmentTypes(
  params: CatalogEquipmentTypeListParams,
  signal?: AbortSignal,
) {
  const response = await authApiClient(
    API_ENDPOINTS.backend.catalog.equipmentTypes.list(params),
    { signal },
  );
  return normalizeCatalogEquipmentTypeList(
    (await response.json()) as CatalogEquipmentTypeListResponse,
    params,
  );
}
