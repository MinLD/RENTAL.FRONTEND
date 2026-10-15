import type { ApiResult } from "@/services/api-error";
import type {
  CatalogBrand,
  CatalogCategoryDetail,
  CatalogEquipmentTypeListItem,
  CatalogPagedResult,
} from "@/types/catalog";

export type CatalogNavigationInitialData = {
  brands: ApiResult<CatalogPagedResult<CatalogBrand>>;
  categories: ApiResult<CatalogPagedResult<CatalogCategoryDetail>>;
  equipmentTypes: ApiResult<
    CatalogPagedResult<CatalogEquipmentTypeListItem>
  > | null;
  categoryId: string | null;
  updatedAt: number;
};
