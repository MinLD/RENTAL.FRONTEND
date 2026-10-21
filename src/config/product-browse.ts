import type { ProductBrowseFilters } from "@/types/product-browse";

export const PRODUCT_PAGE_SIZES = [12, 20, 40] as const;
export const PRODUCT_DEFAULT_PAGE_SIZE = 20;
export const PRODUCT_BROWSE_PATH = "/search";

export function productBrowseHref(filters: Partial<ProductBrowseFilters> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.size ? `${PRODUCT_BROWSE_PATH}?${params}` : PRODUCT_BROWSE_PATH;
}
