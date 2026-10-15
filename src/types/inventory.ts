export const EQUIPMENT_LISTING_STATUS = {
  Draft: 1,
  Active: 2,
  Inactive: 3,
} as const;

export type EquipmentListingStatus =
  (typeof EQUIPMENT_LISTING_STATUS)[keyof typeof EQUIPMENT_LISTING_STATUS];

export type EquipmentListingFilters = {
  equipmentTypeId?: string;
  brandId?: string;
  status?: EquipmentListingStatus;
};

export type EquipmentListingRentalRate = {
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  currency: string;
};

export type EquipmentListingRentalRateResponse = {
  [Key in keyof EquipmentListingRentalRate]:
    EquipmentListingRentalRate[Key] | null;
};

export type EquipmentListingMedia = { id: string; url: string | null };

export type EquipmentListing = {
  id: string;
  ownerUserId: string;
  equipmentTypeId: string;
  brandId: string;
  name: string | null;
  description: string | null;
  model: string | null;
  manufactureYear: number | null;
  media: EquipmentListingMedia[] | null;
  schemaVersion: number;
  specValues: Record<string, unknown> | string;
  thumbnailMediaId: string | null;
  thumbnailUrl: string | null;
  rentalRate: EquipmentListingRentalRateResponse | null;
  depositAmount?: number | null;
  status: string | EquipmentListingStatus | null;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string | null;
};

export type EquipmentListingListResponse = {
  items: EquipmentListing[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type PublicEquipmentListing = Pick<
  EquipmentListing,
  | "id"
  | "equipmentTypeId"
  | "brandId"
  | "name"
  | "description"
  | "model"
  | "manufactureYear"
  | "schemaVersion"
  | "specValues"
  | "rentalRate"
  | "media"
  | "thumbnailUrl"
  | "totalQuantity"
> & {
  availableQuantity: number;
};

export type PublicEquipmentListingListResponse = Omit<
  EquipmentListingListResponse,
  "items"
> & {
  items: PublicEquipmentListing[];
};

export type PublicEquipmentListingDetail = PublicEquipmentListing &
  Pick<EquipmentListing, "depositAmount">;

export type EquipmentAvailabilityCheckRequest = {
  startDate: string;
  endDate: string;
  requestedQuantity: number;
};

export type EquipmentAvailabilityCheckResponse =
  EquipmentAvailabilityCheckRequest & {
    listingId: string;
    availableQuantity: number;
    isAvailable: boolean;
  };

export const PUBLIC_EQUIPMENT_LISTING_SORTS = [
  "created_desc",
  "created_asc",
  "model_desc",
  "model_asc",
  "relevance",
] as const;

export type PublicEquipmentListingSort =
  (typeof PUBLIC_EQUIPMENT_LISTING_SORTS)[number];

export type PublicEquipmentListingSpecFilter = {
  field: string;
  operator: "eq" | "gt" | "gte" | "lt" | "lte";
  value: string | number | boolean;
};

export type PublicEquipmentListingListParams = {
  categoryId?: string;
  equipmentTypeId?: string;
  brandId?: string;
  q?: string;
  sort?: PublicEquipmentListingSort;
  /** Raw JSON array string. URLSearchParams handles encoding. */
  filters?: string;
  from?: string;
  to?: string;
  requestedQuantity?: number;
  page?: number;
  pageSize?: number;
};

export type CreateEquipmentListingRequest = {
  equipmentTypeId: string;
  brandId: string;
  name: string;
  description: string | null;
  model: string;
  serialNumber: string;
  manufactureYear: number | null;
  mediaIds: string[];
  schemaVersion: number;
  specValues: Record<string, string | number | boolean>;
  rentalRate: EquipmentListingRentalRate;
  depositAmount: number;
  thumbnailMediaId: string | null;
};

export type UpdateEquipmentListingRequest = {
  depositAmount?: number;
  brandId?: string;
  name?: string;
  description?: string | null;
  model?: string;
  manufactureYear?: number | null;
  mediaIds?: string[];
  thumbnailMediaId?: string | null;
  schemaVersion?: number;
  specValues?: Record<string, string | number | boolean>;
  status?: EquipmentListingStatus;
};

export type InventoryAsset = {
  id: string;
  equipmentListingId: string;
  assetCode: string | null;
  serialNumber: string | null;
  manufactureYear: number | null;
  acceptingBookings: boolean;
  suspensionReason: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type InventoryAssetListResponse = {
  items: InventoryAsset[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type CreateInventoryAssetRequest = { serialNumber: string };
export type UpdateInventoryAssetRequest = {
  serialNumber?: string;
  manufactureYear?: number | null;
};
export type UpdateInventoryAssetBookingsRequest = {
  acceptingBookings: boolean;
  reason: string | null;
};
export type InventoryCalendarRange = { from: string; to: string };
export type EquipmentListingCalendarDay = {
  date: string;
  occupiedQuantity: number;
  blockedQuantity: number;
  availableQuantity: number;
  suspendedOccupiedQuantity: number;
  suspendedBlockedQuantity: number;
};
export type EquipmentListingCalendar = InventoryCalendarRange & {
  listingId: string;
  totalQuantity: number;
  days: EquipmentListingCalendarDay[];
};
export type InventoryAssetCalendarEntry = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  note: string | null;
  holdExpiresAt: string | null;
};
export type InventoryAssetCalendar = {
  assetId: string;
  startDate: string;
  endDate: string;
  entries: InventoryAssetCalendarEntry[];
};

export type CalendarBlockReason =
  "Maintenance" | "OwnerReserved" | "Inspection" | "Other";
export type CreateInventoryCalendarBlockRequest = {
  startDate: string;
  endDate: string;
  reason: CalendarBlockReason;
  note: string | null;
};
export type InventoryCalendarBlock = CreateInventoryCalendarBlockRequest & {
  id: string;
  assetId: string;
  createdAt: string;
};
