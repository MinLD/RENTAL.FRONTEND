import { CategoryManagementTable } from "@/components/admin/catalog/categories/category-management-table";
import {
  createCatalogCategoryAction,
  getAdminCatalogCategoriesAction,
  getCatalogCategoryAction,
  updateCatalogCategoryAction,
} from "@/services/actions/catalog-actions";

export default function AdminCatalogCategoriesPage() {
  return (
    <CategoryManagementTable
      createCategory={createCatalogCategoryAction}
      fetchCategories={getAdminCatalogCategoriesAction}
      fetchCategoryDetail={getCatalogCategoryAction}
      updateCategory={updateCatalogCategoryAction}
    />
  );
}
