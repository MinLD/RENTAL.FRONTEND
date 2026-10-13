import type { ApiResult } from "@/services/api-error";
import type {
  CatalogBrand,
  CatalogCategoryDetail,
  CatalogEquipmentTypeListItem,
  CatalogPagedResult,
} from "@/types/catalog";
import type { PublicEquipmentListingListResponse } from "@/types/inventory";

export type ProductBrowseFilters = {
  categoryId?: string;
  equipmentTypeId?: string;
  brandId?: string;
  q?: string;
  page: number;
  pageSize: number;
};

export type ProductBrowseData = {
  filters: ProductBrowseFilters;
  categories: ApiResult<CatalogPagedResult<CatalogCategoryDetail>>;
  equipmentTypes: ApiResult<CatalogPagedResult<CatalogEquipmentTypeListItem>>;
  brands: ApiResult<CatalogPagedResult<CatalogBrand>>;
  products: ApiResult<PublicEquipmentListingListResponse> | null;
};
