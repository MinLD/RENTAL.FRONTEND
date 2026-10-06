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
  ) => Promise<CatalogEquipmentTypeDetail>;
  disableEquipmentType: (id: string) => Promise<CatalogEquipmentTypeDetail>;
  fetchCategories: () => Promise<CatalogCategoryDetail[]>;
  fetchEquipmentTypeDetail: (id: string) => Promise<CatalogEquipmentTypeDetail>;
  fetchEquipmentTypes: (
    params: DataTableFetchParams<AdminCatalogEquipmentTypeFilterParams>,
  ) => Promise<DataTableFetchResult<CatalogEquipmentTypeListItem>>;
  publishEquipmentType: (id: string) => Promise<CatalogEquipmentTypeDetail>;
  updateEquipmentType: (
    id: string,
    request: UpdateCatalogEquipmentTypeRequest,
  ) => Promise<CatalogEquipmentTypeDetail>;
};

export type CatalogSpecSchemaActions = {
  createDraft: (
    id: string,
    definition: CatalogSpecDefinition,
  ) => Promise<CatalogSpecSchema>;
  fetchVersion: (id: string, version: number) => Promise<CatalogSpecSchema>;
  fetchVersions: (id: string) => Promise<CatalogSpecSchema[]>;
  publishDraft: (id: string, version: number) => Promise<CatalogSpecSchema>;
  replaceDraft: (
    id: string,
    version: number,
    definition: CatalogSpecDefinition,
  ) => Promise<CatalogSpecSchema>;
};
