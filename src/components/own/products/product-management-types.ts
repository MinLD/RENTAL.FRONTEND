import type { ApiResult } from "@/services/api-error";
import type {
  CatalogBrand,
  CatalogBrandListParams,
  CatalogEquipmentTypeListItem,
  CatalogEquipmentTypeListParams,
  CatalogPagedResult,
  CatalogPublishedSpecSchema,
} from "@/types/catalog";
import type {
  CreateEquipmentListingRequest,
  EquipmentListing,
} from "@/types/inventory";

export type ProductCreateActions = {
  fetchEquipmentTypes: (
    params: CatalogEquipmentTypeListParams,
  ) => Promise<ApiResult<CatalogPagedResult<CatalogEquipmentTypeListItem>>>;
  fetchBrands: (
    params: CatalogBrandListParams,
  ) => Promise<ApiResult<CatalogPagedResult<CatalogBrand>>>;
  fetchSchema: (id: string) => Promise<ApiResult<CatalogPublishedSpecSchema>>;
  create: (
    request: CreateEquipmentListingRequest,
  ) => Promise<ApiResult<EquipmentListing>>;
};
