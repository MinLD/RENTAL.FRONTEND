import type { ApiResult } from "@/services/api-error";
import type {
  AdminCatalogEquipmentTypeFilterParams,
  CatalogCategoryDetail,
  CatalogEquipmentTypeDetail,
  CatalogEquipmentTypeListItem,
  CatalogSpecDefinition,
  CatalogSpecSchema,
  CreateCatalogEquipmentTypeRequest,
  UpdateCatalogEquipmentTypeRequest,
} from "@/types/catalog";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";

export type EquipmentTypeRefreshHandler = () => void;

export type EquipmentTypePendingAction = {
  action: "disable" | "publish";
  equipmentType: CatalogEquipmentTypeListItem | CatalogEquipmentTypeDetail;
  refresh: EquipmentTypeRefreshHandler;
} | null;

export type EquipmentTypeManagementTableProps = {
  schemaActions: CatalogSpecSchemaActions;
  createEquipmentType: (
    request: CreateCatalogEquipmentTypeRequest,
  ) => Promise<ApiResult<CatalogEquipmentTypeDetail>>;
  disableEquipmentType: (
    id: string,
  ) => Promise<ApiResult<CatalogEquipmentTypeDetail>>;
  fetchCategories: () => Promise<ApiResult<CatalogCategoryDetail[]>>;
  fetchEquipmentTypeDetail: (
    id: string,
  ) => Promise<ApiResult<CatalogEquipmentTypeDetail>>;
  fetchEquipmentTypes: (
    params: DataTableFetchParams<AdminCatalogEquipmentTypeFilterParams>,
  ) => Promise<ApiResult<DataTableFetchResult<CatalogEquipmentTypeListItem>>>;
  publishEquipmentType: (
    id: string,
  ) => Promise<ApiResult<CatalogEquipmentTypeDetail>>;
  updateEquipmentType: (
    id: string,
    request: UpdateCatalogEquipmentTypeRequest,
  ) => Promise<ApiResult<CatalogEquipmentTypeDetail>>;
};

export type CatalogSpecSchemaActions = {
  createDraft: (
    id: string,
    definition: CatalogSpecDefinition,
  ) => Promise<ApiResult<CatalogSpecSchema>>;
  fetchVersion: (
    id: string,
    version: number,
  ) => Promise<ApiResult<CatalogSpecSchema>>;
  fetchVersions: (id: string) => Promise<ApiResult<CatalogSpecSchema[]>>;
  publishDraft: (
    id: string,
    version: number,
  ) => Promise<ApiResult<CatalogSpecSchema>>;
  replaceDraft: (
    id: string,
    version: number,
    definition: CatalogSpecDefinition,
  ) => Promise<ApiResult<CatalogSpecSchema>>;
};
