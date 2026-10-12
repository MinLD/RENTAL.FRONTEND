export type EquipmentListingRentalRate = {
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  currency: string;
};

export type EquipmentListing = {
  id: string;
  ownerUserId: string;
  equipmentTypeId: string;
  brandId: string;
  model: string;
  schemaVersion: number;
  specValues: Record<string, unknown> | string;
  thumbnailMediaId: string | null;
  thumbnailUrl: string | null;
  rentalRate: EquipmentListingRentalRate | null;
  status: string;
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

export type CreateEquipmentListingRequest = {
  equipmentTypeId: string;
  brandId: string;
  model: string;
  serialNumber: string;
  schemaVersion: number;
  specValues: Record<string, string | number | boolean>;
  rentalRate: EquipmentListingRentalRate;
  thumbnailMediaId: string | null;
};
