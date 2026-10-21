import "server-only";

import { redirect } from "next/navigation";

import {
  PRODUCT_DEFAULT_PAGE_SIZE,
  productBrowseHref,
} from "@/config/product-browse";
import {
  getCatalogBrands,
  getCatalogCategories,
  getCatalogEquipmentType,
  getCatalogEquipmentTypeSchemaVersion,
  getCatalogEquipmentTypes,
} from "@/services/queries/catalog-queries";
import { getPublicEquipmentListings } from "@/services/queries/inventory-queries";
import { getStoredPublicArea } from "@/services/public-area-server-service";
import { publicAreaParams } from "@/lib/locations/public-area";
import type { ApiResult } from "@/services/api-error";
import type { CatalogEquipmentTypeDetail, CatalogPagedResult, CatalogSpecField } from "@/types/catalog";
import { PUBLIC_EQUIPMENT_LISTING_SORTS } from "@/types/inventory";
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

// The public catalog rejects PageSize > 100. Collect every page so local
// filtering includes the entire catalog without a "load more" control.
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

async function getSpecificationFields(
  selected: ApiResult<CatalogEquipmentTypeDetail> | null,
): Promise<ApiResult<CatalogSpecField[]> | null> {
  if (!selected || !selected.success) return selected;
  const type = selected.data;
  const version = type.currentSchemaVersion;
  if (!version) return { success: true, data: [] };
  if (
    type.specSchema?.version === version &&
    type.specSchema.status?.toLowerCase() === "published" &&
    type.specSchema.definition?.fields
  ) {
    return { success: true, data: type.specSchema.definition.fields };
  }
  const schema = await getCatalogEquipmentTypeSchemaVersion(type.id, version);
  return schema.success ? { success: true, data: schema.data.fields ?? [] } : schema;
}

export async function getProductBrowseData(
  params: ProductBrowseSearchParams,
): Promise<ProductBrowseData> {
  const storedArea = publicAreaParams(await getStoredPublicArea());
  const hasLinkedArea = params.provinceCode !== undefined || params.wardCode !== undefined;
  const requestedPage = Number(getSearchParam(params.page) ?? 1);
  const requestedSize = Number(
    getSearchParam(params.pageSize) ?? PRODUCT_DEFAULT_PAGE_SIZE,
  );
  const requestedSort = getSearchParam(params.sort);
  const requestedQuantity = getSearchParam(params.requestedQuantity);
  const filters: ProductBrowseFilters = {
    provinceCode: hasLinkedArea ? getSearchParam(params.provinceCode) : storedArea.provinceCode,
    wardCode: hasLinkedArea ? getSearchParam(params.wardCode) : storedArea.wardCode,
    categoryId: getSearchParam(params.categoryId),
    equipmentTypeId: getSearchParam(params.equipmentTypeId),
    brandId: getSearchParam(params.brandId),
    q: getSearchParam(params.q),
    sort: PUBLIC_EQUIPMENT_LISTING_SORTS.find((sort) => sort === requestedSort),
    filters: getSearchParam(params.filters),
    from: getSearchParam(params.from),
    to: getSearchParam(params.to),
    requestedQuantity:
      requestedQuantity !== undefined ? Number(requestedQuantity) : undefined,
    page:
      Number.isSafeInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1,
    pageSize:
      Number.isSafeInteger(requestedSize) && requestedSize > 0 && requestedSize <= 100
        ? requestedSize
        : PRODUCT_DEFAULT_PAGE_SIZE,
  };
  const [categories, equipmentTypes, brands, products, selectedType] = await Promise.all([
    getCatalogCategories(),
    getAllFilterOptions((page) =>
      getCatalogEquipmentTypes({
        page,
        pageSize: 100,
        sort: "name_asc",
      }),
    ),
    getAllFilterOptions((page) =>
      getCatalogBrands({ page, pageSize: 100, sort: "name_asc" }),
    ),
    getPublicEquipmentListings(filters),
    filters.equipmentTypeId ? getCatalogEquipmentType(filters.equipmentTypeId) : null,
  ]);
  // Retain a linked type even if it is outside the current category's options.
  if (
    filters.equipmentTypeId &&
    equipmentTypes.success &&
    !equipmentTypes.data.data.some(
      (item) => item.id === filters.equipmentTypeId,
    )
  ) {
    if (selectedType?.success) equipmentTypes.data.data.push(selectedType.data);
  }
  if (
    products.success &&
    filters.page > Math.max(1, products.data.totalPages)
  ) {
    redirect(
      productBrowseHref({
        ...filters,
        page: Math.max(1, products.data.totalPages),
      }),
    );
  }
  const specificationFields = await getSpecificationFields(selectedType);
  return { filters, categories, equipmentTypes, brands, products, specificationFields };
}
