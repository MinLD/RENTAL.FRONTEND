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

export default async function OwnProductsPage() {
  const [brandsResult, equipmentTypesResult] = await Promise.all([
    listCatalogBrandsAction({ page: 1, pageSize: 100 }),
    listCatalogEquipmentTypesAction({ page: 1, pageSize: 100 }),
  ]);

  const initialBrands = brandsResult.success ? brandsResult.data.data : [];
  const initialEquipmentTypes = equipmentTypesResult.success
    ? equipmentTypesResult.data.data
    : [];

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
      initialBrands={initialBrands}
      initialEquipmentTypes={initialEquipmentTypes}
    />
  );
}
