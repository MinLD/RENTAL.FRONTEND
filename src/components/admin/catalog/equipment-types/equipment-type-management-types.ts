import type {
  AdminCatalogEquipmentTypeFilterParams,
  CatalogCategoryDetail,
  CatalogEquipmentTypeDetail,
  CatalogEquipmentTypeListItem,
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
