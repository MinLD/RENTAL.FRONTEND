export const CATALOG_NAVIGATION_STALE_TIME = 5 * 60 * 1000;
export const CATALOG_NAVIGATION_HOVER_DELAY = 180;

export function catalogNavigationEquipmentParams(categoryId: string) {
  return { categoryId, page: 1, pageSize: 100, sort: "name_asc" } as const;
}

export const CATALOG_NAVIGATION_BRAND_PARAMS = {
  page: 1,
  pageSize: 100,
  sort: "name_asc",
} as const;

export function catalogBrowseHref(
  filters: {
    categoryId?: string;
    equipmentTypeId?: string;
    brandId?: string;
  } = {},
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}
