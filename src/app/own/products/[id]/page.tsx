import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { ProductDetailOwnerView } from "@/components/own/products/product-detail-owner-view";
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
  getOwnInventoryAssetAction,
  getOwnInventoryAssetCalendarAction,
  updateOwnEquipmentListingAction,
  updateOwnEquipmentListingRentalRateAction,
  updateOwnInventoryAssetAction,
  updateOwnInventoryAssetBookingsAction,
} from "@/services/actions/inventory-actions";
import { getEquipmentListingName } from "@/utils/inventory";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const productResult = await getOwnEquipmentListingAction(id);
  if (!productResult.success) {
    return { title: "Chi tiết sản phẩm | DPRental" };
  }
  const name = getEquipmentListingName(productResult.data);
  return {
    title: `${name} - Chi tiết & Máy vật lý | DPRental`,
    description: `Quản lý thông tin và máy vật lý cho ${name}.`,
  };
}

export default async function OwnProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productResult = await getOwnEquipmentListingAction(id);

  if (!productResult.success) {
    notFound();
  }

  const product = productResult.data;

  // SSR fetch brand and equipment type name in parallel
  const [brandResult, typeResult] = await Promise.all([
    product.brandId ? getCatalogBrandAction(product.brandId) : null,
    product.equipmentTypeId
      ? getCatalogEquipmentTypeAction(product.equipmentTypeId)
      : null,
  ]);

  const brandName = brandResult?.success ? brandResult.data.name : undefined;
  const typeName = typeResult?.success ? typeResult.data.name : undefined;

  return (
    <QueryProvider>
      <ProductDetailOwnerView
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
        brandName={brandName}
        product={product}
        typeName={typeName}
      />
    </QueryProvider>
  );
}
