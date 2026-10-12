import { ProductDetailView } from "@/components/own/products/product-detail-view";
import {
  getCatalogBrandAction,
  getCatalogEquipmentTypeAction,
  getCatalogEquipmentTypeSchemaVersionAction,
  listCatalogBrandsAction,
} from "@/services/actions/catalog-actions";
import {
  getOwnEquipmentListingAction,
  updateOwnEquipmentListingAction,
  updateOwnEquipmentListingRentalRateAction,
  getOwnEquipmentListingAssetsAction,
  createOwnInventoryAssetAction,
  getOwnInventoryAssetAction,
  updateOwnInventoryAssetAction,
  updateOwnInventoryAssetBookingsAction,
  getOwnInventoryAssetCalendarAction,
  createOwnInventoryCalendarBlockAction,
  deleteOwnInventoryCalendarBlockAction,
  getOwnEquipmentListingCalendarAction,
} from "@/services/actions/inventory-actions";
import {
  getOwnEquipmentListing,
  getOwnEquipmentListingCalendar,
} from "@/services/queries/inventory-queries";
import {
  getCatalogBrand,
  getCatalogEquipmentType,
} from "@/services/queries/catalog-queries";
import { getTodayDate } from "@/utils/calendar";

export default async function OwnProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const today = getTodayDate();
  const productRequest = getOwnEquipmentListing(id);
  const calendarRequest = getOwnEquipmentListingCalendar(id, {
    from: today,
    to: today,
  });
  const initialProduct = await productRequest;
  // Metadata depends on the product; it need not wait for today's calendar.
  const [initialBrand, initialType, initialCalendar] = await Promise.all([
    initialProduct.success
      ? getCatalogBrand(initialProduct.data.brandId)
      : null,
    initialProduct.success
      ? getCatalogEquipmentType(initialProduct.data.equipmentTypeId)
      : null,
    calendarRequest,
  ]);

  return (
    <ProductDetailView
      key={id}
      productId={id}
      initialProduct={initialProduct}
      initialBrand={initialBrand}
      initialType={initialType}
      initialCalendar={initialCalendar}
      initialToday={today}
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
    />
  );
}
