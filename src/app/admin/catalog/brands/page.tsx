import { BrandManagementTable } from "@/components/admin/catalog/brands/brand-management-table";
import {
  createCatalogBrandAction,
  disableCatalogBrandAction,
  enableCatalogBrandAction,
  getAdminCatalogBrandAction,
  getAdminCatalogBrandsAction,
  updateCatalogBrandAction,
} from "@/services/actions/catalog-actions";

export default function AdminCatalogBrandsPage() {
  return (
    <BrandManagementTable
      createBrand={createCatalogBrandAction}
      disableBrand={disableCatalogBrandAction}
      enableBrand={enableCatalogBrandAction}
      fetchBrandDetail={getAdminCatalogBrandAction}
      fetchBrands={getAdminCatalogBrandsAction}
      updateBrand={updateCatalogBrandAction}
    />
  );
}
