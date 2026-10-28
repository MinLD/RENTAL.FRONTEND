export type AnalyticsGranularity = "day" | "week" | "month";

export type AnalyticsOrdersSummary = {
  totalOrders: number;
  paidOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  expiredOrders: number;
  rejectedItems: number;
};

export type AnalyticsFinancialSummary = {
  grossRentalValue: number;
  completedRentalValue: number;
  depositCollected: number;
  platformRevenue: number;
  deductionAmount: number;
  refundAmount: number;
  supplierPayable: number;
  payoutCompleted: number;
  pendingRefund: number | null;
};

export type AnalyticsRentalSummary = {
  paidItems: number;
  rentedQuantity: number;
  completedRentals: number;
};

export type AdminAnalyticsOverviewResponse = {
  from: string;
  to: string;
  currency: string | null;
  orders: AnalyticsOrdersSummary;
  financial: AnalyticsFinancialSummary;
  rental: AnalyticsRentalSummary;
};

export type AnalyticsRevenueBucket = {
  periodStart: string;
  grossRentalValue: number;
  platformRevenue: number;
  refundAmount: number;
  supplierPayout: number;
};

export type AdminAnalyticsRevenueResponse = {
  from: string;
  to: string;
  granularity: AnalyticsGranularity | string | null;
  currency: string | null;
  totalPlatformRevenue: number;
  totalGrossRentalValue: number;
  totalRefundAmount: number;
  totalSupplierPayout: number;
  buckets: AnalyticsRevenueBucket[] | null;
};

export type SupplierAnalyticsOverviewResponse = AdminAnalyticsOverviewResponse;

export type SupplierAnalyticsRevenueResponse = AdminAnalyticsRevenueResponse;

export type OrderTrendPoint = {
  date: string;
  created: number;
  paid: number;
  completed: number;
  cancelled: number;
  expired: number;
};

export type AdminAnalyticsOrdersResponse = {
  from: string;
  to: string;
  active: number;
  points: OrderTrendPoint[] | null;
};

export type EquipmentRank = {
  id: string | null;
  name: string | null;
  rentalItemCount: number;
  rentedQuantity: number;
  grossRentalValue: number;
  completedCount: number;
};

export type AdminAnalyticsEquipmentResponse = {
  from: string;
  to: string;
  topEquipmentTypes: EquipmentRank[] | null;
  topListings: EquipmentRank[] | null;
  topBrands: EquipmentRank[] | null;
};

export type SupplierMetrics = {
  supplierId: string;
  totalRequests: number;
  accepted: number;
  rejected: number;
  timeout: number;
  completedRentals: number;
  rentalValue: number;
  supplierPayable: number;
  payoutCompleted: number;
};

export type AdminAnalyticsSuppliersResponse = {
  from: string;
  to: string;
  page: number;
  pageSize: number;
  total: number;
  items: SupplierMetrics[] | null;
};

export type InventoryListingStatisticsResponse = {
  byEquipmentType: Record<string, number>;
  byBrand: Record<string, number>;
};

export type AnalyticsScope = "Finance" | "Rental";

export type AnalyticsDataChangedEvent = {
  eventId: string;
  version: number;
  occurredAt: string;
  data: {
    scope: AnalyticsScope;
  };
};

export type AnalyticsDateRangeParams = {
  from?: string;
  to?: string;
};

export type AnalyticsRevenueParams = AnalyticsDateRangeParams & {
  granularity?: AnalyticsGranularity;
};

export type AnalyticsEquipmentParams = {
  from: string;
  to: string;
  limit?: number;
};

export type AnalyticsSuppliersParams = {
  from: string;
  to: string;
  page?: number;
  pageSize?: number;
};
