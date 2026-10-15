import "server-only";

import {
  CATALOG_NAVIGATION_BRAND_PARAMS,
  catalogNavigationEquipmentParams,
} from "@/config/catalog-navigation";
import {
  getCatalogCategories,
  getCatalogBrands,
  getCatalogEquipmentTypes,
} from "@/services/queries/catalog-queries";
import type { CatalogNavigationInitialData } from "@/types/catalog-navigation";
import { hasCatalogListings } from "@/utils/catalog";

export async function getCatalogNavigationInitialData(): Promise<CatalogNavigationInitialData> {
  const [categories, brands] = await Promise.all([
    getCatalogCategories(),
    getCatalogBrands(CATALOG_NAVIGATION_BRAND_PARAMS),
  ]);
  const categoryId = categories.success
    ? (categories.data.data.find(hasCatalogListings)?.id ?? null)
    : null;
  const equipmentTypes = categoryId
    ? await getCatalogEquipmentTypes(
        catalogNavigationEquipmentParams(categoryId),
      )
    : null;
  return {
    brands,
    categories,
    equipmentTypes,
    categoryId,
    updatedAt: Date.now(),
  };
}
