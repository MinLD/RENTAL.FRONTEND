import "server-only";

import { catalogNavigationEquipmentParams } from "@/config/catalog-navigation";
import {
  getCatalogCategories,
  getCatalogEquipmentTypes,
} from "@/services/queries/catalog-queries";
import type { CatalogNavigationInitialData } from "@/types/catalog-navigation";

export async function getCatalogNavigationInitialData(): Promise<CatalogNavigationInitialData> {
  const categories = await getCatalogCategories();
  const categoryId = categories.success
    ? (categories.data.data[0]?.id ?? null)
    : null;
  const equipmentTypes = categoryId
    ? await getCatalogEquipmentTypes(
        catalogNavigationEquipmentParams(categoryId),
      )
    : null;
  return {
    categories,
    equipmentTypes,
    categoryId,
    updatedAt: Date.now(),
  };
}
