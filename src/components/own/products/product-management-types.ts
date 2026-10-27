import type { ApiResult } from "@/services/api-error";
import type {
  CatalogBrand,
  CatalogBrandListParams,
  CatalogEquipmentTypeListItem,
  CatalogEquipmentTypeDetail,
  CatalogEquipmentTypeListParams,
  CatalogPagedResult,
  CatalogPublishedSpecSchema,
} from "@/types/catalog";
import type {
  CreateEquipmentListingRequest,
  EquipmentListing,
  EquipmentListingRentalRate,
  UpdateEquipmentListingRequest,
  InventoryAsset,
  InventoryAssetCalendar,
  CreateInventoryAssetRequest,
  UpdateInventoryAssetRequest,
  UpdateInventoryAssetBookingsRequest,
  CreateInventoryCalendarBlockRequest,
  InventoryCalendarBlock,
  EquipmentListingCalendar,
  InventoryCalendarRange,
} from "@/types/inventory";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";

export type ProductCreateActions = {
  fetchEquipmentTypes: (
    params: CatalogEquipmentTypeListParams,
  ) => Promise<ApiResult<CatalogPagedResult<CatalogEquipmentTypeListItem>>>;
  fetchBrands: (
    params: CatalogBrandListParams,
  ) => Promise<ApiResult<CatalogPagedResult<CatalogBrand>>>;
  fetchSchema: (id: string) => Promise<ApiResult<CatalogPublishedSpecSchema>>;
  create: (
    request: CreateEquipmentListingRequest,
  ) => Promise<ApiResult<EquipmentListing>>;
};

export type ProductDetailActions = {
  fetch: (id: string) => Promise<ApiResult<EquipmentListing>>;
  updateInformation: (
    id: string,
    request: UpdateEquipmentListingRequest,
  ) => Promise<ApiResult<EquipmentListing>>;
  updateRentalRate: (
    id: string,
    request: EquipmentListingRentalRate,
  ) => Promise<ApiResult<EquipmentListingRentalRate>>;
  fetchBrand: (id: string) => Promise<ApiResult<CatalogBrand>>;
  fetchEquipmentType: (
    id: string,
  ) => Promise<ApiResult<CatalogEquipmentTypeDetail>>;
  fetchSchemaVersion: (
    id: string,
    version: number,
  ) => Promise<ApiResult<CatalogPublishedSpecSchema>>;
};

export type ProductPageActions = ProductDetailActions & {
  fetchBrands: ProductCreateActions["fetchBrands"];
  fetchAssets: (
    id: string,
    params: DataTableFetchParams,
  ) => Promise<ApiResult<DataTableFetchResult<InventoryAsset>>>;
  createAsset: (
    id: string,
    request: CreateInventoryAssetRequest,
  ) => Promise<ApiResult<InventoryAsset>>;
  fetchAsset: (id: string) => Promise<ApiResult<InventoryAsset>>;
  updateAsset: (
    id: string,
    request: UpdateInventoryAssetRequest,
  ) => Promise<ApiResult<InventoryAsset>>;
  updateAssetBookings: (
    id: string,
    request: UpdateInventoryAssetBookingsRequest,
  ) => Promise<ApiResult<InventoryAsset>>;
  fetchAssetCalendar: (
    id: string,
  ) => Promise<ApiResult<InventoryAssetCalendar>>;
  createCalendarBlock: (
    id: string,
    request: CreateInventoryCalendarBlockRequest,
  ) => Promise<ApiResult<InventoryCalendarBlock>>;
  deleteCalendarBlock: (
    id: string,
    blockId: string,
  ) => Promise<ApiResult<null>>;
  fetchCalendar: (
    id: string,
    range: InventoryCalendarRange,
  ) => Promise<ApiResult<EquipmentListingCalendar>>;
};
