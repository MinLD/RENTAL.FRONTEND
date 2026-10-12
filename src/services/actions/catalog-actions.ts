"use server";

import { ApiInputError } from "@/services/api-error";
import type { ApiResult } from "@/services/api-error";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import type {
  AdminCatalogBrandListParams,
  AdminCatalogBrandFilterParams,
  AdminCatalogCategoryFilterParams,
  AdminCatalogEquipmentTypeFilterParams,
  AdminCatalogEquipmentTypeListParams,
  CatalogBrand,
  CatalogBrandDto,
  CatalogBrandListParams,
  CatalogBrandListResponse,
  CatalogBrandSort,
  CatalogCategoryDetail,
  CatalogCategoryDetailResponse,
  CatalogCategoryListParams,
  CatalogCategoryListResponse,
  CatalogEquipmentTypeDetail,
  CatalogEquipmentTypeDetailDto,
  CatalogEquipmentTypeListItem,
  CatalogEquipmentTypeListParams,
  CatalogEquipmentTypeListResponse,
  CatalogPagedResult,
  CatalogPublishedSpecSchema,
  CatalogPublishedSpecSchemaResponse,
  CatalogSpecDefinition,
  CatalogSpecSchema,
  CatalogSpecificationValidationResult,
  CreateCatalogBrandRequest,
  CreateCatalogCategoryRequest,
  CreateCatalogEquipmentTypeRequest,
  UpdateCatalogBrandRequest,
  UpdateCatalogCategoryRequest,
  UpdateCatalogEquipmentTypeRequest,
  ValidateCatalogSpecificationRequest,
} from "@/types/catalog";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import {
  normalizeCatalogBrand,
  normalizeCatalogCategoryDetail,
  normalizeCatalogEquipmentTypeDetail,
  normalizeCatalogEquipmentTypeListItem,
  normalizeCatalogPublishedSpecSchema,
  normalizeCatalogSpecSchema,
  normalizeCatalogValidationResult,
} from "@/utils/catalog";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATALOG_BRAND_SORT_VALUES = new Set<CatalogBrandSort>([
  "name_asc",
  "name_desc",
  "newest",
]);

export async function listCatalogBrandsAction(
  params: CatalogBrandListParams = {},
): Promise<ApiResult<CatalogPagedResult<CatalogBrand>>> {
  return serverApiResult(async () => {
    const normalizedParams = normalizeCatalogBrandListParams(params);
    const response = await serverApiJson<CatalogBrandListResponse>(
      API_ENDPOINTS.backend.catalog.brands.list(normalizedParams),
      "Không thể tải danh sách thương hiệu.",
    );

    return mapCatalogBrandPagedResult(response, normalizedParams);
  });
}

export async function getCatalogBrandAction(
  brandId: string,
): Promise<ApiResult<CatalogBrand>> {
  return serverApiResult(async () => {
    assertUuid(brandId, "ID thương hiệu không hợp lệ.");

    const response = await serverApiJson<CatalogBrandDto>(
      API_ENDPOINTS.backend.catalog.brands.detail(brandId),
      "Không thể tải chi tiết thương hiệu.",
    );

    return normalizeCatalogBrand(response);
  });
}

export async function listAdminCatalogBrandsAction(
  params: AdminCatalogBrandListParams = {},
): Promise<ApiResult<CatalogPagedResult<CatalogBrand>>> {
  return serverApiResult(() => listAdminCatalogBrands(params));
}

async function listAdminCatalogBrands(
  params: AdminCatalogBrandListParams = {},
): Promise<CatalogPagedResult<CatalogBrand>> {
  const normalizedParams = normalizeCatalogBrandListParams(params);
  const response = await serverApiJson<CatalogBrandListResponse>(
    API_ENDPOINTS.backend.catalog.brands.adminList(normalizedParams),
    "Không thể tải danh sách thương hiệu.",
  );

  return mapCatalogBrandPagedResult(response, normalizedParams);
}

export async function getAdminCatalogBrandsAction(
  params: DataTableFetchParams<AdminCatalogBrandFilterParams>,
): Promise<ApiResult<DataTableFetchResult<CatalogBrand>>> {
  return serverApiResult(async () => {
    const response = await listAdminCatalogBrands({
      isActive: params.filters?.isActive,
      keyword: params.keyword,
      page: params.page,
      pageSize: params.pageSize,
      sort: params.filters?.sort,
    });

    return {
      data: response.data,
      totalItems: response.totalItems,
    };
  });
}

export async function getAdminCatalogBrandAction(
  brandId: string,
): Promise<ApiResult<CatalogBrand>> {
  return serverApiResult(async () => {
    assertUuid(brandId, "ID thương hiệu không hợp lệ.");

    const response = await serverApiJson<CatalogBrandDto>(
      API_ENDPOINTS.backend.catalog.brands.adminDetail(brandId),
      "Không thể tải chi tiết thương hiệu.",
    );

    return normalizeCatalogBrand(response);
  });
}

export async function createCatalogBrandAction(
  request: CreateCatalogBrandRequest,
): Promise<ApiResult<CatalogBrand>> {
  return serverApiResult(async () => {
    const response = await serverApiJson<CatalogBrandDto>(
      API_ENDPOINTS.backend.catalog.brands.create,
      "Không thể tạo thương hiệu.",
      {
        json: request,
        method: "POST",
      },
    );

    return normalizeCatalogBrand(response);
  });
}

export async function updateCatalogBrandAction(
  brandId: string,
  request: UpdateCatalogBrandRequest,
): Promise<ApiResult<CatalogBrand>> {
  return serverApiResult(async () => {
    assertUuid(brandId, "ID thương hiệu không hợp lệ.");

    const response = await serverApiJson<CatalogBrandDto>(
      API_ENDPOINTS.backend.catalog.brands.update(brandId),
      "Không thể cập nhật thương hiệu.",
      {
        json: request,
        method: "PATCH",
      },
    );

    return normalizeCatalogBrand(response);
  });
}

export async function disableCatalogBrandAction(
  brandId: string,
): Promise<ApiResult<CatalogBrand>> {
  return serverApiResult(async () => {
    assertUuid(brandId, "ID thương hiệu không hợp lệ.");

    const response = await serverApiJson<CatalogBrandDto>(
      API_ENDPOINTS.backend.catalog.brands.disable(brandId),
      "Không thể vô hiệu hóa thương hiệu.",
      {
        method: "POST",
      },
    );

    return normalizeCatalogBrand(response);
  });
}

export async function enableCatalogBrandAction(
  brandId: string,
): Promise<ApiResult<CatalogBrand>> {
  return serverApiResult(async () => {
    assertUuid(brandId, "ID thương hiệu không hợp lệ.");

    const response = await serverApiJson<CatalogBrandDto>(
      API_ENDPOINTS.backend.catalog.brands.enable(brandId),
      "Không thể kích hoạt thương hiệu.",
      {
        method: "POST",
      },
    );

    return normalizeCatalogBrand(response);
  });
}

export async function listCatalogCategoriesAction(): Promise<
  ApiResult<CatalogPagedResult<CatalogCategoryDetail>>
> {
  return serverApiResult(() => listCatalogCategories());
}

async function listCatalogCategories(): Promise<
  CatalogPagedResult<CatalogCategoryDetail>
> {
  const response = await serverApiJson<
    CatalogCategoryDetailResponse[] | CatalogCategoryListResponse
  >(
    API_ENDPOINTS.backend.catalog.categories.list(),
    "Không thể tải danh sách danh mục.",
  );

  return mapCatalogCategoryPagedResult(response);
}

export async function getAdminCatalogCategoriesAction(
  params: DataTableFetchParams<AdminCatalogCategoryFilterParams>,
): Promise<ApiResult<DataTableFetchResult<CatalogCategoryDetail>>> {
  return serverApiResult(async () => {
    const queryParams: CatalogCategoryListParams = {
      isActive: params.filters?.isActive,
      keyword: params.keyword,
      page: params.page,
      pageSize: params.pageSize,
      sort: params.filters?.sort,
    };
    const response = await serverApiJson<CatalogCategoryListResponse>(
      API_ENDPOINTS.backend.catalog.categories.adminList(queryParams),
      "Không thể tải danh sách danh mục.",
    );
    const result = mapCatalogCategoryPagedResult(response, queryParams);

    return {
      data: result.data,
      totalItems: result.totalItems,
    };
  });
}

export async function getAdminCatalogCategoryAction(
  id: string,
): Promise<ApiResult<CatalogCategoryDetail>> {
  return serverApiResult(async () => {
    assertUuid(id, "ID danh mục không hợp lệ.");

    const response = await serverApiJson<CatalogCategoryDetailResponse>(
      API_ENDPOINTS.backend.catalog.categories.adminDetail(id),
      "Không thể tải chi tiết danh mục.",
    );

    return normalizeCatalogCategoryDetail(response);
  });
}

export async function getCatalogCategoryAction(
  id: string,
): Promise<ApiResult<CatalogCategoryDetail>> {
  return serverApiResult(async () => {
    assertUuid(id, "ID danh mục không hợp lệ.");

    const response = await serverApiJson<CatalogCategoryDetailResponse>(
      API_ENDPOINTS.backend.catalog.categories.detail(id),
      "Không thể tải chi tiết danh mục.",
    );

    return normalizeCatalogCategoryDetail(response);
  });
}

export async function listActiveCatalogCategoriesAction(): Promise<
  ApiResult<CatalogCategoryDetail[]>
> {
  return serverApiResult(async () => {
    const response = await listCatalogCategories();

    return response.data;
  });
}

export async function createCatalogCategoryAction(
  request: CreateCatalogCategoryRequest,
): Promise<ApiResult<CatalogCategoryDetail>> {
  return serverApiResult(async () => {
    const response = await serverApiJson<CatalogCategoryDetailResponse>(
      API_ENDPOINTS.backend.catalog.categories.create,
      "Không thể tạo danh mục.",
      {
        json: request,
        method: "POST",
      },
    );

    return normalizeCatalogCategoryDetail(response);
  });
}

export async function updateCatalogCategoryAction(
  id: string,
  request: UpdateCatalogCategoryRequest,
): Promise<ApiResult<CatalogCategoryDetail>> {
  return serverApiResult(async () => {
    assertUuid(id, "ID danh mục không hợp lệ.");

    const response = await serverApiJson<CatalogCategoryDetailResponse>(
      API_ENDPOINTS.backend.catalog.categories.update(id),
      "Không thể cập nhật danh mục.",
      {
        json: request,
        method: "PATCH",
      },
    );

    return normalizeCatalogCategoryDetail(response);
  });
}

export async function listCatalogEquipmentTypesAction(
  params: CatalogEquipmentTypeListParams = {},
): Promise<ApiResult<CatalogPagedResult<CatalogEquipmentTypeListItem>>> {
  return serverApiResult(async () => {
    const response = await serverApiJson<CatalogEquipmentTypeListResponse>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.list(params),
      "Không thể tải danh sách loại thiết bị.",
    );

    return {
      data: (response.items ?? []).map(normalizeCatalogEquipmentTypeListItem),
      page: response.page ?? params.page ?? 1,
      pageSize: response.pageSize ?? params.pageSize ?? 0,
      totalItems: response.totalCount ?? 0,
      totalPages: response.totalPages ?? 0,
    };
  });
}

export async function getAdminCatalogEquipmentTypesAction(
  params: DataTableFetchParams<AdminCatalogEquipmentTypeFilterParams>,
): Promise<ApiResult<DataTableFetchResult<CatalogEquipmentTypeListItem>>> {
  return serverApiResult(async () => {
    const queryParams: AdminCatalogEquipmentTypeListParams = {
      categoryId: params.filters?.categoryId,
      keyword: params.keyword,
      page: params.page,
      pageSize: params.pageSize,
      sort: params.filters?.sort,
      status: params.filters?.status,
    };

    const response = await serverApiJson<CatalogEquipmentTypeListResponse>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.adminList(queryParams),
      "Không thể tải danh sách loại thiết bị.",
    );

    return {
      data: (response.items ?? []).map(normalizeCatalogEquipmentTypeListItem),
      totalItems: response.totalCount ?? 0,
    };
  });
}

export async function getAdminCatalogEquipmentTypeAction(
  id: string,
): Promise<ApiResult<CatalogEquipmentTypeDetail>> {
  return serverApiResult(async () => {
    assertUuid(id, "ID loại thiết bị không hợp lệ.");

    const response = await serverApiJson<CatalogEquipmentTypeDetailDto>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.adminDetail(id),
      "Không thể tải chi tiết loại thiết bị.",
    );

    return normalizeCatalogEquipmentTypeDetail(response);
  });
}

export async function getCatalogEquipmentTypeAction(
  id: string,
): Promise<ApiResult<CatalogEquipmentTypeDetail>> {
  return serverApiResult(async () => {
    assertUuid(id, "ID loại thiết bị không hợp lệ.");

    const response = await serverApiJson<CatalogEquipmentTypeDetailDto>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.detail(id),
      "Không thể tải chi tiết loại thiết bị.",
    );

    return normalizeCatalogEquipmentTypeDetail(response);
  });
}

export async function getCatalogEquipmentTypeSchemaAction(
  equipmentTypeId: string,
): Promise<ApiResult<CatalogPublishedSpecSchema>> {
  return serverApiResult(async () => {
    assertUuid(equipmentTypeId, "ID loại thiết bị không hợp lệ.");

    const response = await serverApiJson<CatalogPublishedSpecSchemaResponse>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.currentSchema(
        equipmentTypeId,
      ),
      "Không thể tải schema hiện tại của loại thiết bị.",
    );

    return normalizeCatalogPublishedSpecSchema(response);
  });
}

export async function getCatalogEquipmentTypeSchemaVersionAction(
  equipmentTypeId: string,
  version: number,
): Promise<ApiResult<CatalogPublishedSpecSchema>> {
  return serverApiResult(async () => {
    assertUuid(equipmentTypeId, "ID loại thiết bị không hợp lệ.");
    assertSchemaVersion(version);

    const response = await serverApiJson<CatalogPublishedSpecSchemaResponse>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.publishedSchemaVersion(
        equipmentTypeId,
        version,
      ),
      "Không thể tải schema version của loại thiết bị.",
    );

    return normalizeCatalogPublishedSpecSchema(response);
  });
}

export async function validateCatalogSpecificationsAction(
  equipmentTypeId: string,
  request: ValidateCatalogSpecificationRequest,
): Promise<ApiResult<CatalogSpecificationValidationResult>> {
  return serverApiResult(async () => {
    assertUuid(equipmentTypeId, "ID loại thiết bị không hợp lệ.");

    const response = await serverApiJson<CatalogSpecificationValidationResult>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.validateSpecifications(
        equipmentTypeId,
      ),
      "Không thể validate thông số thiết bị.",
      {
        json: request,
        method: "POST",
      },
    );

    return normalizeCatalogValidationResult(response);
  });
}

export async function createCatalogEquipmentTypeAction(
  request: CreateCatalogEquipmentTypeRequest,
): Promise<ApiResult<CatalogEquipmentTypeDetail>> {
  return serverApiResult(async () => {
    const response = await serverApiJson<CatalogEquipmentTypeDetailDto>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.create,
      "Không thể tạo loại thiết bị.",
      {
        json: request,
        method: "POST",
      },
    );

    return normalizeCatalogEquipmentTypeDetail(response);
  });
}

export async function updateCatalogEquipmentTypeAction(
  id: string,
  request: UpdateCatalogEquipmentTypeRequest,
): Promise<ApiResult<CatalogEquipmentTypeDetail>> {
  return serverApiResult(async () => {
    assertUuid(id, "ID loại thiết bị không hợp lệ.");

    const response = await serverApiJson<CatalogEquipmentTypeDetailDto>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.update(id),
      "Không thể cập nhật loại thiết bị.",
      {
        json: request,
        method: "PATCH",
      },
    );

    return normalizeCatalogEquipmentTypeDetail(response);
  });
}

export async function publishCatalogEquipmentTypeAction(
  id: string,
): Promise<ApiResult<CatalogEquipmentTypeDetail>> {
  return serverApiResult(async () => {
    assertUuid(id, "ID loại thiết bị không hợp lệ.");

    const response = await serverApiJson<CatalogEquipmentTypeDetailDto>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.publish(id),
      "Không thể publish loại thiết bị.",
      {
        method: "POST",
      },
    );

    return normalizeCatalogEquipmentTypeDetail(response);
  });
}

export async function disableCatalogEquipmentTypeAction(
  id: string,
): Promise<ApiResult<CatalogEquipmentTypeDetail>> {
  return serverApiResult(async () => {
    assertUuid(id, "ID loại thiết bị không hợp lệ.");

    const response = await serverApiJson<CatalogEquipmentTypeDetailDto>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.disable(id),
      "Không thể disable loại thiết bị.",
      {
        method: "POST",
      },
    );

    return normalizeCatalogEquipmentTypeDetail(response);
  });
}

export async function listCatalogSpecSchemasAction(
  equipmentTypeId: string,
): Promise<ApiResult<CatalogSpecSchema[]>> {
  return serverApiResult(async () => {
    assertUuid(equipmentTypeId, "ID loại thiết bị không hợp lệ.");

    const response = await serverApiJson<CatalogSpecSchema[]>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.specSchemas(equipmentTypeId),
      "Không thể tải danh sách version schema.",
    );

    return (response ?? []).map(normalizeCatalogSpecSchema);
  });
}

export async function createCatalogSpecSchemaDraftAction(
  equipmentTypeId: string,
  definition: CatalogSpecDefinition,
): Promise<ApiResult<CatalogSpecSchema>> {
  return serverApiResult(async () => {
    assertUuid(equipmentTypeId, "ID loại thiết bị không hợp lệ.");

    const response = await serverApiJson<CatalogSpecSchema>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.specSchemas(equipmentTypeId),
      "Không thể tạo draft schema.",
      {
        json: definition,
        method: "POST",
      },
    );

    return normalizeCatalogSpecSchema(response);
  });
}

export async function getCatalogSpecSchemaAction(
  equipmentTypeId: string,
  version: number,
): Promise<ApiResult<CatalogSpecSchema>> {
  return serverApiResult(async () => {
    assertUuid(equipmentTypeId, "ID loại thiết bị không hợp lệ.");
    assertSchemaVersion(version);

    const response = await serverApiJson<CatalogSpecSchema>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.specSchema(
        equipmentTypeId,
        version,
      ),
      "Không thể tải schema version.",
    );

    return normalizeCatalogSpecSchema(response);
  });
}

export async function replaceCatalogSpecSchemaDraftAction(
  equipmentTypeId: string,
  version: number,
  definition: CatalogSpecDefinition,
): Promise<ApiResult<CatalogSpecSchema>> {
  return serverApiResult(async () => {
    assertUuid(equipmentTypeId, "ID loại thiết bị không hợp lệ.");
    assertSchemaVersion(version);

    const response = await serverApiJson<CatalogSpecSchema>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.specSchema(
        equipmentTypeId,
        version,
      ),
      "Không thể cập nhật draft schema.",
      {
        json: definition,
        method: "PUT",
      },
    );

    return normalizeCatalogSpecSchema(response);
  });
}

export async function publishCatalogSpecSchemaDraftAction(
  equipmentTypeId: string,
  version: number,
): Promise<ApiResult<CatalogSpecSchema>> {
  return serverApiResult(async () => {
    assertUuid(equipmentTypeId, "ID loại thiết bị không hợp lệ.");
    assertSchemaVersion(version);

    const response = await serverApiJson<CatalogSpecSchema>(
      API_ENDPOINTS.backend.catalog.equipmentTypes.specSchemaPublish(
        equipmentTypeId,
        version,
      ),
      "Không thể publish draft schema.",
      {
        method: "POST",
      },
    );

    return normalizeCatalogSpecSchema(response);
  });
}

function mapCatalogBrandPagedResult(
  response: CatalogBrandListResponse,
  params: CatalogBrandListParams = {},
): CatalogPagedResult<CatalogBrand> {
  return {
    data: (response.items ?? []).map(normalizeCatalogBrand),
    page: response.page ?? params.page ?? 1,
    pageSize: response.pageSize ?? params.pageSize ?? 0,
    totalItems: response.totalCount ?? 0,
    totalPages: response.totalPages ?? 0,
  };
}

function mapCatalogCategoryPagedResult(
  response: CatalogCategoryDetailResponse[] | CatalogCategoryListResponse,
  params: CatalogCategoryListParams = {},
): CatalogPagedResult<CatalogCategoryDetail> {
  if (Array.isArray(response)) {
    return {
      data: response.map(normalizeCatalogCategoryDetail),
      page: params.page ?? 1,
      pageSize: params.pageSize ?? response.length,
      totalItems: response.length,
      totalPages: 1,
    };
  }

  return {
    data: (response.items ?? []).map(normalizeCatalogCategoryDetail),
    page: response.page ?? params.page ?? 1,
    pageSize: response.pageSize ?? params.pageSize ?? 0,
    totalItems: response.totalCount ?? 0,
    totalPages: response.totalPages ?? 0,
  };
}

function assertUuid(value: string, message: string) {
  if (!UUID_PATTERN.test(value)) {
    throw new ApiInputError(message);
  }
}

function normalizeCatalogBrandListParams<
  TParams extends CatalogBrandListParams,
>(params: TParams): TParams {
  const normalizedSort = normalizeCatalogBrandSort(params.sort);

  if (normalizedSort === params.sort) {
    return params;
  }

  return {
    ...params,
    sort: normalizedSort,
  };
}

function normalizeCatalogBrandSort(
  sort?: string,
): CatalogBrandSort | undefined {
  if (!sort) {
    return undefined;
  }

  return CATALOG_BRAND_SORT_VALUES.has(sort as CatalogBrandSort)
    ? (sort as CatalogBrandSort)
    : undefined;
}

function assertSchemaVersion(version: number) {
  if (!Number.isInteger(version) || version <= 0) {
    throw new ApiInputError("Version schema không hợp lệ.");
  }
}
