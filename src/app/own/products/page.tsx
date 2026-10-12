import { ProductsManagementTable } from "@/components/own/products/products-management-table";
import {
  getCatalogEquipmentTypeSchemaAction,
  listCatalogBrandsAction,
  listCatalogEquipmentTypesAction,
} from "@/services/actions/catalog-actions";
import {
  createOwnEquipmentListingAction,
  getOwnEquipmentListingsAction,
} from "@/services/actions/inventory-actions";

export default function OwnProductsPage() {
  return (
    <ProductsManagementTable
      createActions={{
        create: createOwnEquipmentListingAction,
        fetchBrands: listCatalogBrandsAction,
        fetchEquipmentTypes: listCatalogEquipmentTypesAction,
        fetchSchema: getCatalogEquipmentTypeSchemaAction,
      }}
      fetchProducts={getOwnEquipmentListingsAction}
    />
  );
}
