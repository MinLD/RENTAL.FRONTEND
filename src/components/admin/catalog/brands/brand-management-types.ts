import type { ApiResult } from "@/services/api-error";
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
  createBrand: (
    request: CreateCatalogBrandRequest,
  ) => Promise<ApiResult<CatalogBrand>>;
  disableBrand: (id: string) => Promise<ApiResult<CatalogBrand>>;
  enableBrand: (id: string) => Promise<ApiResult<CatalogBrand>>;
  fetchBrandDetail: (id: string) => Promise<ApiResult<CatalogBrand>>;
  fetchBrands: (
    params: DataTableFetchParams<AdminCatalogBrandFilterParams>,
  ) => Promise<ApiResult<DataTableFetchResult<CatalogBrand>>>;
  updateBrand: (
    id: string,
    request: UpdateCatalogBrandRequest,
  ) => Promise<ApiResult<CatalogBrand>>;
};
