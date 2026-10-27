import { ProductsManagementTable } from "@/components/own/products/products-management-table";
import {
  getCatalogBrandAction,
  getCatalogEquipmentTypeAction,
  getCatalogEquipmentTypeSchemaAction,
  getCatalogEquipmentTypeSchemaVersionAction,
  listCatalogBrandsAction,
  listCatalogEquipmentTypesAction,
} from "@/services/actions/catalog-actions";
import {
  createOwnEquipmentListingAction,
  getOwnEquipmentListingAction,
  getOwnEquipmentListingsAction,
  updateOwnEquipmentListingAction,
  updateOwnEquipmentListingRentalRateAction,
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
      detailActions={{
        fetch: getOwnEquipmentListingAction,
        updateInformation: updateOwnEquipmentListingAction,
        updateRentalRate: updateOwnEquipmentListingRentalRateAction,
        fetchBrand: getCatalogBrandAction,
        fetchEquipmentType: getCatalogEquipmentTypeAction,
        fetchSchemaVersion: getCatalogEquipmentTypeSchemaVersionAction,
      }}
      fetchProducts={getOwnEquipmentListingsAction}
    />
  );
}
