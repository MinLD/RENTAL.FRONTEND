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
  currency: string;
  orders: AnalyticsOrdersSummary;
  financial: AnalyticsFinancialSummary;
  rental: AnalyticsRentalSummary;
};

export type AnalyticsRevenueBucket = {
  periodStart: string;
  platformRevenue: number;
  grossRentalValue: number;
  refundAmount: number;
  supplierPayout: number;
};

export type AdminAnalyticsRevenueResponse = {
  from: string;
  to: string;
  granularity: AnalyticsGranularity;
  currency: string;
  totalPlatformRevenue: number;
  totalGrossRentalValue: number;
  totalRefundAmount: number;
  totalSupplierPayout: number;
  buckets: AnalyticsRevenueBucket[];
};

export type SupplierAnalyticsOverviewResponse = AdminAnalyticsOverviewResponse;

export type SupplierAnalyticsRevenueResponse = AdminAnalyticsRevenueResponse;

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
