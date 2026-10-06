import type {
  AdminCatalogBrandFilterParams,
  CatalogBrand,
  CreateCatalogBrandRequest,
  UpdateCatalogBrandRequest,
} from "@/types/catalog";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";

export type BrandRefreshHandler = () => void;

export type BrandPendingAction = {
  action: "disable" | "enable";
  brand: CatalogBrand;
  refresh: BrandRefreshHandler;
} | null;

export type BrandManagementTableProps = {
  createBrand: (request: CreateCatalogBrandRequest) => Promise<CatalogBrand>;
  disableBrand: (id: string) => Promise<CatalogBrand>;
  enableBrand: (id: string) => Promise<CatalogBrand>;
  fetchBrandDetail: (id: string) => Promise<CatalogBrand>;
  fetchBrands: (
    params: DataTableFetchParams<AdminCatalogBrandFilterParams>,
  ) => Promise<DataTableFetchResult<CatalogBrand>>;
  updateBrand: (
    id: string,
    request: UpdateCatalogBrandRequest,
  ) => Promise<CatalogBrand>;
};
