import { ProductCalendarView } from "@/components/own/products/product-calendar-view";
import {
  getCatalogBrandAction,
  getCatalogEquipmentTypeAction,
  getCatalogEquipmentTypeSchemaVersionAction,
  listCatalogBrandsAction,
} from "@/services/actions/catalog-actions";
import {
  createOwnInventoryAssetAction,
  createOwnInventoryCalendarBlockAction,
  deleteOwnInventoryCalendarBlockAction,
  getOwnEquipmentListingAction,
  getOwnEquipmentListingAssetsAction,
  getOwnEquipmentListingCalendarAction,
  getOwnEquipmentListingsAction,
  getOwnInventoryAssetAction,
  getOwnInventoryAssetCalendarAction,
  updateOwnEquipmentListingAction,
  updateOwnEquipmentListingRentalRateAction,
  updateOwnInventoryAssetAction,
  updateOwnInventoryAssetBookingsAction,
} from "@/services/actions/inventory-actions";

export default async function OwnProductsCalendarPage() {
  const productsResult = await getOwnEquipmentListingsAction({
    keyword: "",
    page: 1,
    pageSize: 100,
  });

  const initialProducts = productsResult.success ? productsResult.data.data : [];

  return (
    <ProductCalendarView
      actions={{
        fetch: getOwnEquipmentListingAction,
        updateInformation: updateOwnEquipmentListingAction,
        updateRentalRate: updateOwnEquipmentListingRentalRateAction,
        fetchBrand: getCatalogBrandAction,
        fetchEquipmentType: getCatalogEquipmentTypeAction,
        fetchSchemaVersion: getCatalogEquipmentTypeSchemaVersionAction,
        fetchBrands: listCatalogBrandsAction,
        fetchAssets: getOwnEquipmentListingAssetsAction,
        createAsset: createOwnInventoryAssetAction,
        fetchAsset: getOwnInventoryAssetAction,
        updateAsset: updateOwnInventoryAssetAction,
        updateAssetBookings: updateOwnInventoryAssetBookingsAction,
        fetchAssetCalendar: getOwnInventoryAssetCalendarAction,
        createCalendarBlock: createOwnInventoryCalendarBlockAction,
        deleteCalendarBlock: deleteOwnInventoryCalendarBlockAction,
        fetchCalendar: getOwnEquipmentListingCalendarAction,
      }}
      initialProducts={initialProducts}
    />
  );
}
