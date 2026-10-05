export const CATALOG_EQUIPMENT_TYPE_STATUS = {
  Draft: 0,
  Published: 1,
  Disabled: 2,
} as const;

export type CatalogEquipmentTypeStatus =
  (typeof CATALOG_EQUIPMENT_TYPE_STATUS)[keyof typeof CATALOG_EQUIPMENT_TYPE_STATUS];

export type CatalogSpecDataType =
  | "boolean"
  | "enum"
  | "number"
  | "text"
  | (string & {});

export type CatalogBrandDto = {
  code?: string | null;
  createdAt?: string;
  id?: string;
  isActive?: boolean;
  logoMediaId?: string | null;
  logoUrl?: string | null;
  name?: string | null;
  slug?: string | null;
  updatedAt?: string | null;
};

export type CatalogBrandListResponse = {
  items?: CatalogBrandDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
};

export type CreateCatalogBrandRequest = {
  code?: string | null;
  logoMediaId?: string | null;
  name?: string | null;
  slug?: string | null;
};

export type UpdateCatalogBrandRequest = CreateCatalogBrandRequest;

export type CatalogCategoryDto = {
  id?: string;
  imageMediaId?: string | null;
  imageUrl?: string | null;
  name?: string | null;
};

export type CatalogCategoryDetailResponse = CatalogCategoryDto & {
  description?: string | null;
  isActive?: boolean;
  slug?: string | null;
};

export type CreateCatalogCategoryRequest = {
  description?: string | null;
  imageMediaId?: string | null;
  name?: string | null;
};

export type UpdateCatalogCategoryRequest = {
  description?: string | null;
  imageMediaId?: string | null;
  isActive?: boolean | null;
  name?: string | null;
};

export type CatalogEquipmentTypeMediaItem = {
  displayOrder: number;
  isThumbnail: boolean;
  mediaId: string;
};

export type CatalogEquipmentTypeMediaResponse = CatalogEquipmentTypeMediaItem & {
  url?: string | null;
};

export type CatalogSpecOption = {
  label?: string | null;
  value?: string | null;
};

export type CatalogSpecField = {
  dataType?: CatalogSpecDataType | null;
  description?: string | null;
  displayOrder: number;
  filterable: boolean;
  key?: string | null;
  label?: string | null;
  max?: number | null;
  metadata?: unknown;
  min?: number | null;
  options?: CatalogSpecOption[] | null;
  primary: boolean;
  required: boolean;
  unit?: string | null;
};

export type CatalogSpecDefinition = {
  fields?: CatalogSpecField[] | null;
};

export type CatalogSpecSchema = {
  createdAt?: string;
  definition?: CatalogSpecDefinition | null;
  equipmentTypeId?: string;
  id?: string;
  publishedAt?: string | null;
  status?: string | null;
  version?: number;
};

export type CatalogPublishedSpecSchema = {
  equipmentTypeId?: string;
  fields?: CatalogSpecField[] | null;
  version?: number;
};

export type CatalogEquipmentTypePrimarySpec = {
  key?: string | null;
  label?: string | null;
  unit?: string | null;
};

export type CatalogEquipmentTypeListItemDto = {
  categories?: CatalogCategoryDto[] | null;
  code?: string | null;
  currentSchemaVersion?: number | null;
  description?: string | null;
  id?: string;
  name?: string | null;
  thumbnailMediaId?: string | null;
  thumbnailUrl?: string | null;
};

export type CatalogEquipmentTypeListResponse = {
  items?: CatalogEquipmentTypeListItemDto[] | null;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
};

export type CatalogEquipmentTypeDetailDto =
  CatalogEquipmentTypeListItemDto & {
    createdAt?: string;
    media?: CatalogEquipmentTypeMediaResponse[] | null;
    primarySpecs?: CatalogEquipmentTypePrimarySpec[] | null;
    publishedAt?: string | null;
    specSchema?: CatalogSpecSchema | null;
    status?: CatalogEquipmentTypeStatus;
    updatedAt?: string | null;
  };

export type CreateCatalogEquipmentTypeRequest = {
  categoryIds?: string[] | null;
  code?: string | null;
  description?: string | null;
  media?: CatalogEquipmentTypeMediaItem[] | null;
  name?: string | null;
  specSchema?: CatalogSpecDefinition | null;
};

export type UpdateCatalogEquipmentTypeRequest = {
  categoryIds: string[];
  code: string;
  description?: string | null;
  media: CatalogEquipmentTypeMediaItem[];
  name: string;
};

export type ValidateCatalogSpecificationRequest = {
  schemaVersion: number;
  specValues: unknown;
};

export type CatalogSpecificationValidationErrorCode =
  | "INVALID_ENUM_OPTION"
  | "OUT_OF_RANGE"
  | "REQUIRED"
  | "TYPE_MISMATCH"
  | "UNKNOWN_FIELD"
  | (string & {});

export type CatalogSpecificationValidationError = {
  code?: CatalogSpecificationValidationErrorCode | null;
  field?: string | null;
  message?: string | null;
};

export type CatalogSpecificationValidationResult = {
  errors?: CatalogSpecificationValidationError[] | null;
  valid: boolean;
};

export type CatalogEquipmentTypeListParams = {
  categoryId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
};

export type CatalogBrandListParams = {
  keyword?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
};

export type AdminCatalogBrandListParams = CatalogBrandListParams & {
  isActive?: boolean;
};

export type CatalogPagedResult<TItem> = {
  data: TItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type CatalogBrand = {
  code: string;
  createdAt?: string;
  id: string;
  isActive: boolean;
  logoMediaId?: string;
  logoUrl?: string;
  name: string;
  slug?: string;
  updatedAt?: string;
};

export type CatalogCategory = {
  id: string;
  imageMediaId?: string;
  imageUrl?: string;
  name: string;
};

export type CatalogCategoryDetail = CatalogCategory & {
  description?: string;
  isActive: boolean;
  slug?: string;
};

export type CatalogEquipmentTypeListItem = {
  categories: CatalogCategory[];
  code: string;
  currentSchemaVersion?: number;
  description?: string;
  id: string;
  name: string;
  thumbnailMediaId?: string;
  thumbnailUrl?: string;
};

export type CatalogEquipmentTypeDetail = CatalogEquipmentTypeListItem & {
  createdAt?: string;
  media: CatalogEquipmentTypeMediaResponse[];
  primarySpecs: CatalogEquipmentTypePrimarySpec[];
  publishedAt?: string;
  specSchema?: CatalogSpecSchema;
  status?: CatalogEquipmentTypeStatus;
  updatedAt?: string;
};
