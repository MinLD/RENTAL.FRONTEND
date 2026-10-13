import "server-only";

import { redirect } from "next/navigation";

import {
  PRODUCT_DEFAULT_PAGE_SIZE,
  PRODUCT_PAGE_SIZES,
  productBrowseHref,
} from "@/config/product-browse";
import {
  getCatalogBrands,
  getCatalogCategories,
  getCatalogEquipmentType,
  getCatalogEquipmentTypes,
} from "@/services/queries/catalog-queries";
import { getPublicEquipmentListings } from "@/services/queries/inventory-queries";
import type { ApiResult } from "@/services/api-error";
import type { CatalogPagedResult } from "@/types/catalog";
import type {
  ProductBrowseData,
  ProductBrowseFilters,
} from "@/types/product-browse";

export type ProductBrowseSearchParams = Record<
  string,
  string | string[] | undefined
>;

function getSearchParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

// Search filter options locally, including options beyond the first API page.
async function getAllFilterOptions<T>(
  getPage: (page: number) => Promise<ApiResult<CatalogPagedResult<T>>>,
): Promise<ApiResult<CatalogPagedResult<T>>> {
  const first = await getPage(1);
  if (!first.success || first.data.totalPages <= 1) return first;
  const remaining = await Promise.all(
    Array.from({ length: first.data.totalPages - 1 }, (_, index) =>
      getPage(index + 2),
    ),
  );
  for (const result of remaining) {
    if (!result.success) return result;
    first.data.data.push(...result.data.data);
  }
  return first;
}

export async function getProductBrowseData(
  params: ProductBrowseSearchParams,
): Promise<ProductBrowseData> {
  const requestedPage = Number(getSearchParam(params.page) ?? 1);
  const requestedSize = Number(
    getSearchParam(params.pageSize) ?? PRODUCT_DEFAULT_PAGE_SIZE,
  );
  const filters: ProductBrowseFilters = {
    categoryId: getSearchParam(params.categoryId),
    equipmentTypeId: getSearchParam(params.equipmentTypeId),
    brandId: getSearchParam(params.brandId),
    q: getSearchParam(params.q),
    page:
      Number.isSafeInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1,
    pageSize: PRODUCT_PAGE_SIZES.some((size) => size === requestedSize)
      ? requestedSize
      : PRODUCT_DEFAULT_PAGE_SIZE,
  };
  const [categories, equipmentTypes, brands, products] = await Promise.all([
    getCatalogCategories(),
    getAllFilterOptions((page) =>
      getCatalogEquipmentTypes({
        categoryId: filters.categoryId,
        page,
        pageSize: 100,
        sort: "name_asc",
      }),
    ),
    getAllFilterOptions((page) =>
      getCatalogBrands({ page, pageSize: 100, sort: "name_asc" }),
    ),
    filters.categoryId && !filters.equipmentTypeId
      ? null
      : getPublicEquipmentListings({
          equipmentTypeId: filters.equipmentTypeId,
          brandId: filters.brandId,
          q: filters.q,
          page: filters.page,
          pageSize: filters.pageSize,
        }),
  ]);
  // Retain a linked type even if it is outside the current category's options.
  if (
    filters.equipmentTypeId &&
    equipmentTypes.success &&
    !equipmentTypes.data.data.some(
      (item) => item.id === filters.equipmentTypeId,
    )
  ) {
    const selected = await getCatalogEquipmentType(filters.equipmentTypeId);
    if (selected.success) equipmentTypes.data.data.push(selected.data);
  }
  if (
    products?.success &&
    filters.page > Math.max(1, products.data.totalPages)
  ) {
    redirect(
      productBrowseHref({
        ...filters,
        page: Math.max(1, products.data.totalPages),
      }),
    );
  }
  return { filters, categories, equipmentTypes, brands, products };
}
