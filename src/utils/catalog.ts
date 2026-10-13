import {
  CATALOG_EQUIPMENT_TYPE_STATUS,
  type CatalogBrand,
  type CatalogBrandDto,
  type CatalogBrandListParams,
  type CatalogBrandListResponse,
  type CatalogCategory,
  type CatalogCategoryDetail,
  type CatalogCategoryDetailResponse,
  type CatalogCategoryListParams,
  type CatalogCategoryListResponse,
  type CatalogCategoryDto,
  type CatalogEquipmentTypeDetail,
  type CatalogEquipmentTypeDetailDto,
  type CatalogEquipmentTypeListItem,
  type CatalogEquipmentTypeListItemDto,
  type CatalogEquipmentTypeListParams,
  type CatalogEquipmentTypeListResponse,
  type CatalogPagedResult,
  type CatalogEquipmentTypeMediaResponse,
  type CatalogEquipmentTypePrimarySpec,
  type CatalogEquipmentTypeStatus,
  type CatalogPublishedSpecSchema,
  type CatalogPublishedSpecSchemaResponse,
  type CatalogSpecDefinition,
  type CatalogSpecField,
  type CatalogSpecOption,
  type CatalogSpecSchema,
  type CatalogSpecificationValidationError,
  type CatalogSpecificationValidationResult,
} from "@/types/catalog";

export function normalizeCatalogBrandList(
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

export function normalizeCatalogCategoryList(
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

export function normalizeCatalogEquipmentTypeList(
  response: CatalogEquipmentTypeListResponse,
  params: CatalogEquipmentTypeListParams = {},
): CatalogPagedResult<CatalogEquipmentTypeListItem> {
  return {
    data: (response.items ?? []).map(normalizeCatalogEquipmentTypeListItem),
    page: response.page ?? params.page ?? 1,
    pageSize: response.pageSize ?? params.pageSize ?? 0,
    totalItems: response.totalCount ?? 0,
    totalPages: response.totalPages ?? 0,
  };
}

const EQUIPMENT_TYPE_STATUS_LABELS: Record<CatalogEquipmentTypeStatus, string> = {
  [CATALOG_EQUIPMENT_TYPE_STATUS.Draft]: "Nháp",
  [CATALOG_EQUIPMENT_TYPE_STATUS.Published]: "Đang hoạt động",
  [CATALOG_EQUIPMENT_TYPE_STATUS.Disabled]: "Ngừng hoạt động",
};

export function normalizeCatalogBrand(brand: CatalogBrandDto): CatalogBrand {
  return {
    code: normalizeText(brand.code) ?? "",
    ...(normalizeText(brand.createdAt)
      ? { createdAt: normalizeText(brand.createdAt) }
      : {}),
    id: brand.id ?? "",
    isActive: brand.isActive === true,
    ...(normalizeText(brand.logoMediaId)
      ? { logoMediaId: normalizeText(brand.logoMediaId) }
      : {}),
    ...(normalizeText(brand.logoUrl)
      ? { logoUrl: normalizeText(brand.logoUrl) }
      : {}),
    name:
      normalizeText(brand.name) ??
      normalizeText(brand.code) ??
      "Chưa đặt tên",
    ...(normalizeText(brand.slug) ? { slug: normalizeText(brand.slug) } : {}),
    ...(normalizeText(brand.updatedAt)
      ? { updatedAt: normalizeText(brand.updatedAt) }
      : {}),
  };
}

export function getCatalogBrandStatusLabel(isActive: boolean) {
  return isActive ? "Đang hoạt động" : "Ngừng hoạt động";
}

export function normalizeCatalogCategory(
  category: CatalogCategoryDto,
): CatalogCategory {
  return {
    id: category.id ?? "",
    name: normalizeText(category.name) ?? "Chưa đặt tên",
    ...(normalizeText(category.imageMediaId)
      ? { imageMediaId: normalizeText(category.imageMediaId) }
      : {}),
    ...(normalizeText(category.imageUrl)
      ? { imageUrl: normalizeText(category.imageUrl) }
      : {}),
  };
}

export function normalizeCatalogCategoryDetail(
  category: CatalogCategoryDetailResponse,
): CatalogCategoryDetail {
  return {
    ...normalizeCatalogCategory(category),
    ...(normalizeText(category.description)
      ? { description: normalizeText(category.description) }
      : {}),
    isActive: category.isActive === true,
    ...(normalizeText(category.slug) ? { slug: normalizeText(category.slug) } : {}),
  };
}

export function normalizeCatalogCategories(
  categories?: CatalogCategoryDto[] | null,
) {
  return (categories ?? []).map(normalizeCatalogCategory);
}

export function normalizeCatalogEquipmentTypeListItem(
  equipmentType: CatalogEquipmentTypeListItemDto,
): CatalogEquipmentTypeListItem {
  return {
    categories: normalizeCatalogCategories(equipmentType.categories),
    code: normalizeText(equipmentType.code) ?? "",
    ...(typeof equipmentType.currentSchemaVersion === "number"
      ? { currentSchemaVersion: equipmentType.currentSchemaVersion }
      : {}),
    ...(normalizeText(equipmentType.description)
      ? { description: normalizeText(equipmentType.description) }
      : {}),
    id: equipmentType.id ?? "",
    name:
      normalizeText(equipmentType.name) ??
      normalizeText(equipmentType.code) ??
      "Chưa đặt tên",
    ...(normalizeText(equipmentType.publishedAt)
      ? { publishedAt: normalizeText(equipmentType.publishedAt) }
      : {}),
    ...(isCatalogEquipmentTypeStatus(equipmentType.status)
      ? { status: equipmentType.status }
      : {}),
    ...(normalizeText(equipmentType.thumbnailMediaId)
      ? { thumbnailMediaId: normalizeText(equipmentType.thumbnailMediaId) }
      : {}),
    ...(normalizeText(equipmentType.thumbnailUrl)
      ? { thumbnailUrl: normalizeText(equipmentType.thumbnailUrl) }
      : {}),
    ...(normalizeText(equipmentType.updatedAt)
      ? { updatedAt: normalizeText(equipmentType.updatedAt) }
      : {}),
  };
}

export function normalizeCatalogEquipmentTypeDetail(
  equipmentType: CatalogEquipmentTypeDetailDto,
): CatalogEquipmentTypeDetail {
  const media = normalizeCatalogMediaItems(equipmentType.media);
  const thumbnail = getCatalogThumbnail(media);
  const listItem = normalizeCatalogEquipmentTypeListItem({
    ...equipmentType,
    thumbnailMediaId: equipmentType.thumbnailMediaId ?? thumbnail?.mediaId,
    thumbnailUrl: equipmentType.thumbnailUrl ?? thumbnail?.url,
  });

  return {
    ...listItem,
    ...(normalizeText(equipmentType.createdAt)
      ? { createdAt: normalizeText(equipmentType.createdAt) }
      : {}),
    media,
    primarySpecs: normalizeCatalogPrimarySpecs(equipmentType.primarySpecs),
    ...(normalizeText(equipmentType.publishedAt)
      ? { publishedAt: normalizeText(equipmentType.publishedAt) }
      : {}),
    ...(equipmentType.specSchema
      ? { specSchema: normalizeCatalogSpecSchema(equipmentType.specSchema) }
      : {}),
    ...(isCatalogEquipmentTypeStatus(equipmentType.status)
      ? { status: equipmentType.status }
      : {}),
    ...(normalizeText(equipmentType.updatedAt)
      ? { updatedAt: normalizeText(equipmentType.updatedAt) }
      : {}),
  };
}

export function normalizeCatalogMediaItems(
  media?: CatalogEquipmentTypeMediaResponse[] | null,
) {
  return [...(media ?? [])].sort(compareDisplayOrder);
}

export function getCatalogThumbnail(
  media?: CatalogEquipmentTypeMediaResponse[] | null,
) {
  const items = normalizeCatalogMediaItems(media);

  return items.find((item) => item.isThumbnail) ?? items[0] ?? null;
}

export function normalizeCatalogSpecDefinition(
  definition?: CatalogSpecDefinition | null,
): CatalogSpecDefinition {
  return {
    fields: normalizeCatalogSpecFields(definition?.fields),
  };
}

export function normalizeCatalogSpecSchema(
  schema: CatalogSpecSchema,
): CatalogSpecSchema {
  return {
    ...schema,
    definition: normalizeCatalogSpecDefinition(schema.definition),
  };
}

export function normalizeCatalogPublishedSpecSchema(
  schema: CatalogPublishedSpecSchemaResponse,
): CatalogPublishedSpecSchema {
  const version = schema.schemaVersion ?? schema.version;
  return {
    ...schema,
    schemaVersion: version,
    version,
    fields: normalizeCatalogSpecFields(
      schema.fields?.map((field, index) => ({
        ...field,
        displayOrder: field.displayOrder ?? index,
        required: field.required ?? false,
        filterable: field.filterable ?? false,
        primary: field.primary ?? false,
        options: field.options?.map((option) =>
          typeof option === "string" ? { label: option, value: option } : option,
        ),
      })),
    ),
  };
}

export function normalizeCatalogSpecFields(
  fields?: CatalogSpecField[] | null,
) {
  return [...(fields ?? [])].map(normalizeCatalogSpecField).sort(compareDisplayOrder);
}

export function normalizeCatalogSpecField(
  field: CatalogSpecField,
): CatalogSpecField {
  return {
    ...field,
    dataType: normalizeText(field.dataType) ?? field.dataType,
    description: normalizeText(field.description),
    key: normalizeText(field.key),
    label: normalizeText(field.label),
    options: normalizeCatalogSpecOptions(field.options),
    unit: normalizeText(field.unit),
  };
}

export function normalizeCatalogSpecOptions(
  options?: CatalogSpecOption[] | null,
) {
  return (options ?? []).map((option) => ({
    label: normalizeText(option.label),
    value: normalizeText(option.value),
  }));
}

export function normalizeCatalogValidationResult(
  result: CatalogSpecificationValidationResult,
): CatalogSpecificationValidationResult {
  return {
    errors: normalizeCatalogValidationErrors(result.errors),
    valid: result.valid === true,
  };
}

export function normalizeCatalogValidationErrors(
  errors?: CatalogSpecificationValidationError[] | null,
) {
  return (errors ?? []).map((error) => ({
    code: normalizeText(error.code),
    field: normalizeText(error.field),
    message: normalizeText(error.message) ?? "Thông số không hợp lệ.",
  }));
}

export function getCatalogEquipmentTypeStatusLabel(
  status?: CatalogEquipmentTypeStatus | null,
) {
  if (!isCatalogEquipmentTypeStatus(status)) {
    return "Không xác định";
  }

  return EQUIPMENT_TYPE_STATUS_LABELS[status];
}

export function isCatalogEquipmentTypeStatus(
  status: unknown,
): status is CatalogEquipmentTypeStatus {
  return (
    status === CATALOG_EQUIPMENT_TYPE_STATUS.Draft ||
    status === CATALOG_EQUIPMENT_TYPE_STATUS.Published ||
    status === CATALOG_EQUIPMENT_TYPE_STATUS.Disabled
  );
}

function normalizeCatalogPrimarySpecs(
  specs?: CatalogEquipmentTypePrimarySpec[] | null,
) {
  return (specs ?? []).map((spec) => ({
    key: normalizeText(spec.key),
    label: normalizeText(spec.label),
    unit: normalizeText(spec.unit),
  }));
}

function compareDisplayOrder<TItem extends { displayOrder: number }>(
  current: TItem,
  next: TItem,
) {
  return current.displayOrder - next.displayOrder;
}

function normalizeText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}
