import type { ApiResult } from "@/services/api-error";
import type {
  AdminCatalogCategoryFilterParams,
  CatalogCategoryDetail,
  CreateCatalogCategoryRequest,
  UpdateCatalogCategoryRequest,
} from "@/types/catalog";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";

export type CategoryRefreshHandler = () => void;

export type CategoryManagementTableProps = {
  createCategory: (
    request: CreateCatalogCategoryRequest,
  ) => Promise<ApiResult<CatalogCategoryDetail>>;
  fetchCategories: (
    params: DataTableFetchParams<AdminCatalogCategoryFilterParams>,
  ) => Promise<ApiResult<DataTableFetchResult<CatalogCategoryDetail>>>;
  fetchCategoryDetail: (
    id: string,
  ) => Promise<ApiResult<CatalogCategoryDetail>>;
  updateCategory: (
    id: string,
    request: UpdateCatalogCategoryRequest,
  ) => Promise<ApiResult<CatalogCategoryDetail>>;
};
