import type { ApiResult } from "@/services/api-error";
import type {
  CatalogBrand,
  CatalogCategoryDetail,
  CatalogEquipmentTypeListItem,
  CatalogPagedResult,
  CatalogSpecField,
} from "@/types/catalog";
import type {
  PublicEquipmentListingListParams,
  PublicEquipmentListingListResponse,
} from "@/types/inventory";

export type ProductBrowseFilters = PublicEquipmentListingListParams & {
  page: number;
  pageSize: number;
};

export type ProductBrowseData = {
  filters: ProductBrowseFilters;
  categories: ApiResult<CatalogPagedResult<CatalogCategoryDetail>>;
  equipmentTypes: ApiResult<CatalogPagedResult<CatalogEquipmentTypeListItem>>;
  brands: ApiResult<CatalogPagedResult<CatalogBrand>>;
  specificationFields: ApiResult<CatalogSpecField[]> | null;
  products: ApiResult<PublicEquipmentListingListResponse>;
};
