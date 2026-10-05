"use server";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApiJson } from "@/services/server-api";
import type {
  AdminCatalogBrandListParams,
  CatalogBrand,
  CatalogBrandDto,
  CatalogBrandListParams,
  CatalogBrandListResponse,
  CatalogCategoryDetail,
  CatalogCategoryDetailResponse,
  CatalogEquipmentTypeDetail,
  CatalogEquipmentTypeDetailDto,
  CatalogEquipmentTypeListItem,
  CatalogEquipmentTypeListParams,
  CatalogEquipmentTypeListResponse,
  CatalogPagedResult,
  CatalogPublishedSpecSchema,
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

export async function listCatalogBrandsAction(
  params: CatalogBrandListParams = {},
): Promise<CatalogPagedResult<CatalogBrand>> {
  const response = await serverApiJson<CatalogBrandListResponse>(
    API_ENDPOINTS.backend.catalog.brands.list(params),
    "Không thể tải danh sách thương hiệu.",
  );

  return mapCatalogBrandPagedResult(response, params);
}

export async function getCatalogBrandAction(
  brandId: string,
): Promise<CatalogBrand> {
  assertUuid(brandId, "ID thương hiệu không hợp lệ.");

  const response = await serverApiJson<CatalogBrandDto>(
    API_ENDPOINTS.backend.catalog.brands.detail(brandId),
    "Không thể tải chi tiết thương hiệu.",
  );

  return normalizeCatalogBrand(response);
}

export async function listAdminCatalogBrandsAction(
  params: AdminCatalogBrandListParams = {},
): Promise<CatalogPagedResult<CatalogBrand>> {
  const response = await serverApiJson<CatalogBrandListResponse>(
    API_ENDPOINTS.backend.catalog.brands.adminList(params),
    "Không thể tải danh sách thương hiệu.",
  );

  return mapCatalogBrandPagedResult(response, params);
}

export async function getAdminCatalogBrandAction(
  brandId: string,
): Promise<CatalogBrand> {
  assertUuid(brandId, "ID thương hiệu không hợp lệ.");

  const response = await serverApiJson<CatalogBrandDto>(
    API_ENDPOINTS.backend.catalog.brands.adminDetail(brandId),
    "Không thể tải chi tiết thương hiệu.",
  );

  return normalizeCatalogBrand(response);
}

export async function createCatalogBrandAction(
  request: CreateCatalogBrandRequest,
): Promise<CatalogBrand> {
  const response = await serverApiJson<CatalogBrandDto>(
    API_ENDPOINTS.backend.catalog.brands.create,
    "Không thể tạo thương hiệu.",
    {
      json: request,
      method: "POST",
    },
  );

  return normalizeCatalogBrand(response);
}

export async function updateCatalogBrandAction(
  brandId: string,
  request: UpdateCatalogBrandRequest,
): Promise<CatalogBrand> {
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
}

export async function disableCatalogBrandAction(
  brandId: string,
): Promise<CatalogBrand> {
  assertUuid(brandId, "ID thương hiệu không hợp lệ.");

  const response = await serverApiJson<CatalogBrandDto>(
    API_ENDPOINTS.backend.catalog.brands.disable(brandId),
    "Không thể vô hiệu hóa thương hiệu.",
    {
      method: "POST",
    },
  );

  return normalizeCatalogBrand(response);
}

export async function enableCatalogBrandAction(
  brandId: string,
): Promise<CatalogBrand> {
  assertUuid(brandId, "ID thương hiệu không hợp lệ.");

  const response = await serverApiJson<CatalogBrandDto>(
    API_ENDPOINTS.backend.catalog.brands.enable(brandId),
    "Không thể kích hoạt thương hiệu.",
    {
      method: "POST",
    },
  );

  return normalizeCatalogBrand(response);
}

export async function listCatalogCategoriesAction(): Promise<
  CatalogCategoryDetail[]
> {
  const response = await serverApiJson<CatalogCategoryDetailResponse[]>(
    API_ENDPOINTS.backend.catalog.categories.list,
    "Không thể tải danh sách danh mục.",
  );

  return (response ?? []).map(normalizeCatalogCategoryDetail);
}

export async function getCatalogCategoryAction(
  id: string,
): Promise<CatalogCategoryDetail> {
  assertUuid(id, "ID danh mục không hợp lệ.");

  const response = await serverApiJson<CatalogCategoryDetailResponse>(
    API_ENDPOINTS.backend.catalog.categories.detail(id),
    "Không thể tải chi tiết danh mục.",
  );

  return normalizeCatalogCategoryDetail(response);
}

export async function createCatalogCategoryAction(
  request: CreateCatalogCategoryRequest,
): Promise<CatalogCategoryDetail> {
  const response = await serverApiJson<CatalogCategoryDetailResponse>(
    API_ENDPOINTS.backend.catalog.categories.create,
    "Không thể tạo danh mục.",
    {
      json: request,
      method: "POST",
    },
  );

  return normalizeCatalogCategoryDetail(response);
}

export async function updateCatalogCategoryAction(
  id: string,
  request: UpdateCatalogCategoryRequest,
): Promise<CatalogCategoryDetail> {
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
}

export async function listCatalogEquipmentTypesAction(
  params: CatalogEquipmentTypeListParams = {},
): Promise<CatalogPagedResult<CatalogEquipmentTypeListItem>> {
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
}

export async function getCatalogEquipmentTypeAction(
  id: string,
): Promise<CatalogEquipmentTypeDetail> {
  assertUuid(id, "ID loại thiết bị không hợp lệ.");

  const response = await serverApiJson<CatalogEquipmentTypeDetailDto>(
    API_ENDPOINTS.backend.catalog.equipmentTypes.detail(id),
    "Không thể tải chi tiết loại thiết bị.",
  );

  return normalizeCatalogEquipmentTypeDetail(response);
}

export async function getCatalogEquipmentTypeSchemaAction(
  equipmentTypeId: string,
): Promise<CatalogPublishedSpecSchema> {
  assertUuid(equipmentTypeId, "ID loại thiết bị không hợp lệ.");

  const response = await serverApiJson<CatalogPublishedSpecSchema>(
    API_ENDPOINTS.backend.catalog.equipmentTypes.currentSchema(equipmentTypeId),
    "Không thể tải schema hiện tại của loại thiết bị.",
  );

  return normalizeCatalogPublishedSpecSchema(response);
}

export async function getCatalogEquipmentTypeSchemaVersionAction(
  equipmentTypeId: string,
  version: number,
): Promise<CatalogPublishedSpecSchema> {
  assertUuid(equipmentTypeId, "ID loại thiết bị không hợp lệ.");
  assertSchemaVersion(version);

  const response = await serverApiJson<CatalogPublishedSpecSchema>(
    API_ENDPOINTS.backend.catalog.equipmentTypes.publishedSchemaVersion(
      equipmentTypeId,
      version,
    ),
    "Không thể tải schema version của loại thiết bị.",
  );

  return normalizeCatalogPublishedSpecSchema(response);
}

export async function validateCatalogSpecificationsAction(
  equipmentTypeId: string,
  request: ValidateCatalogSpecificationRequest,
): Promise<CatalogSpecificationValidationResult> {
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
}

export async function createCatalogEquipmentTypeAction(
  request: CreateCatalogEquipmentTypeRequest,
): Promise<CatalogEquipmentTypeDetail> {
  const response = await serverApiJson<CatalogEquipmentTypeDetailDto>(
    API_ENDPOINTS.backend.catalog.equipmentTypes.create,
    "Không thể tạo loại thiết bị.",
    {
      json: request,
      method: "POST",
    },
  );

  return normalizeCatalogEquipmentTypeDetail(response);
}

export async function updateCatalogEquipmentTypeAction(
  id: string,
  request: UpdateCatalogEquipmentTypeRequest,
): Promise<CatalogEquipmentTypeDetail> {
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
}

export async function publishCatalogEquipmentTypeAction(
  id: string,
): Promise<CatalogEquipmentTypeDetail> {
  assertUuid(id, "ID loại thiết bị không hợp lệ.");

  const response = await serverApiJson<CatalogEquipmentTypeDetailDto>(
    API_ENDPOINTS.backend.catalog.equipmentTypes.publish(id),
    "Không thể publish loại thiết bị.",
    {
      method: "POST",
    },
  );

  return normalizeCatalogEquipmentTypeDetail(response);
}

export async function disableCatalogEquipmentTypeAction(
  id: string,
): Promise<CatalogEquipmentTypeDetail> {
  assertUuid(id, "ID loại thiết bị không hợp lệ.");

  const response = await serverApiJson<CatalogEquipmentTypeDetailDto>(
    API_ENDPOINTS.backend.catalog.equipmentTypes.disable(id),
    "Không thể disable loại thiết bị.",
    {
      method: "POST",
    },
  );

  return normalizeCatalogEquipmentTypeDetail(response);
}

export async function listCatalogSpecSchemasAction(
  equipmentTypeId: string,
): Promise<CatalogSpecSchema[]> {
  assertUuid(equipmentTypeId, "ID loại thiết bị không hợp lệ.");

  const response = await serverApiJson<CatalogSpecSchema[]>(
    API_ENDPOINTS.backend.catalog.equipmentTypes.specSchemas(equipmentTypeId),
    "Không thể tải danh sách version schema.",
  );

  return (response ?? []).map(normalizeCatalogSpecSchema);
}

export async function createCatalogSpecSchemaDraftAction(
  equipmentTypeId: string,
  definition: CatalogSpecDefinition,
): Promise<CatalogSpecSchema> {
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
}

export async function getCatalogSpecSchemaAction(
  equipmentTypeId: string,
  version: number,
): Promise<CatalogSpecSchema> {
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
}

export async function replaceCatalogSpecSchemaDraftAction(
  equipmentTypeId: string,
  version: number,
  definition: CatalogSpecDefinition,
): Promise<CatalogSpecSchema> {
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
}

export async function publishCatalogSpecSchemaDraftAction(
  equipmentTypeId: string,
  version: number,
): Promise<CatalogSpecSchema> {
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

function assertUuid(value: string, message: string) {
  if (!UUID_PATTERN.test(value)) {
    throw new Error(message);
  }
}

function assertSchemaVersion(version: number) {
  if (!Number.isInteger(version) || version <= 0) {
    throw new Error("Version schema không hợp lệ.");
  }
}
