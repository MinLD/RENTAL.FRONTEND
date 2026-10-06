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
  ) => Promise<CatalogCategoryDetail>;
  fetchCategories: (
    params: DataTableFetchParams<AdminCatalogCategoryFilterParams>,
  ) => Promise<DataTableFetchResult<CatalogCategoryDetail>>;
  fetchCategoryDetail: (id: string) => Promise<CatalogCategoryDetail>;
  updateCategory: (
    id: string,
    request: UpdateCatalogCategoryRequest,
  ) => Promise<CatalogCategoryDetail>;
};
