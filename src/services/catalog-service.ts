import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClient } from "@/services/api-client";
import { ApiError } from "@/services/api-error";
import type {
  CatalogBrandListParams,
  CatalogBrandListResponse,
  CatalogCategoryDetailResponse,
  CatalogCategoryListResponse,
  CatalogEquipmentTypeListParams,
  CatalogEquipmentTypeListResponse,
} from "@/types/catalog";
import {
  normalizeCatalogBrandList,
  normalizeCatalogCategoryList,
  normalizeCatalogEquipmentTypeList,
} from "@/utils/catalog";

export async function fetchCatalogBrands(
  params: CatalogBrandListParams,
  signal?: AbortSignal,
) {
  try {
    const response = await authApiClient(
      API_ENDPOINTS.backend.catalog.brands.list(params),
      { signal },
    );
    return normalizeCatalogBrandList(
      (await response.json()) as CatalogBrandListResponse,
      params,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { data: [], page: params.page ?? 1, pageSize: params.pageSize ?? 20, totalItems: 0, totalPages: 1 };
    }
    throw error;
  }
}

// The public catalog uses the existing same-origin BFF. Parse JSON even when
// the backend labels the category response as text/plain in its API contract.
export async function fetchCatalogCategories(signal?: AbortSignal) {
  try {
    const response = await authApiClient(
      API_ENDPOINTS.backend.catalog.categories.list(),
      { signal },
    );
    const data = (await response.json()) as
      CatalogCategoryDetailResponse[] | CatalogCategoryListResponse;
    return normalizeCatalogCategoryList(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { data: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };
    }
    throw error;
  }
}

export async function fetchCatalogEquipmentTypes(
  params: CatalogEquipmentTypeListParams,
  signal?: AbortSignal,
) {
  try {
    const response = await authApiClient(
      API_ENDPOINTS.backend.catalog.equipmentTypes.list(params),
      { signal },
    );
    return normalizeCatalogEquipmentTypeList(
      (await response.json()) as CatalogEquipmentTypeListResponse,
      params,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { data: [], page: params.page ?? 1, pageSize: params.pageSize ?? 20, totalItems: 0, totalPages: 1 };
    }
    throw error;
  }
}
