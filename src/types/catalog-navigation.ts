import type { ApiResult } from "@/services/api-error";
import type {
  CatalogCategoryDetail,
  CatalogEquipmentTypeListItem,
  CatalogPagedResult,
} from "@/types/catalog";

export type CatalogNavigationInitialData = {
  categories: ApiResult<CatalogPagedResult<CatalogCategoryDetail>>;
  equipmentTypes: ApiResult<
    CatalogPagedResult<CatalogEquipmentTypeListItem>
  > | null;
  categoryId: string | null;
  updatedAt: number;
};
