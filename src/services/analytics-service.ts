import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import {
  calculateTotalListings,
  generateMockAdminOverview,
  generateMockAdminRevenue,
  generateMockSupplierOverview,
  generateMockSupplierRevenue,
  MOCK_INVENTORY_STATISTICS_SAMPLE,
} from "@/mocks/analytics/dashboard-mock-data";
import type {
  AdminAnalyticsOverviewResponse,
  AdminAnalyticsRevenueResponse,
  AnalyticsDateRangeParams,
  AnalyticsRevenueParams,
  InventoryListingStatisticsResponse,
  SupplierAnalyticsOverviewResponse,
  SupplierAnalyticsRevenueResponse,
} from "@/types/analytics";

const isMockAnalytics = process.env.NEXT_PUBLIC_MOCK_ANALYTICS_API !== "false";

/**
 * Lấy 4 thẻ tổng quan Admin toàn sàn
 * Path: GET /api/v1/analytics/overview
 */
export async function getAdminAnalyticsOverview(
  params?: AnalyticsDateRangeParams,
): Promise<AdminAnalyticsOverviewResponse> {
  if (isMockAnalytics && typeof window === "undefined") {
    return generateMockAdminOverview(params?.from, params?.to);
  }
  return authApiClientJson<AdminAnalyticsOverviewResponse>(
    API_ENDPOINTS.backend.analytics.overview(params),
    { cache: "no-store" },
  );
}

/**
 * Lấy dữ liệu biểu đồ GMV và Phí nền tảng Admin
 * Path: GET /api/v1/analytics/revenue
 */
export async function getAdminAnalyticsRevenue(
  params?: AnalyticsRevenueParams,
): Promise<AdminAnalyticsRevenueResponse> {
  if (isMockAnalytics && typeof window === "undefined") {
    return generateMockAdminRevenue(params?.from, params?.to, params?.granularity);
  }
  return authApiClientJson<AdminAnalyticsRevenueResponse>(
    API_ENDPOINTS.backend.analytics.revenue(params),
    { cache: "no-store" },
  );
}

/**
 * Lấy 4 thẻ tổng quan của Nhà cung cấp
 * Path: GET /api/v1/analytics/me/overview
 */
export async function getSupplierAnalyticsOverview(
  params?: AnalyticsDateRangeParams,
): Promise<SupplierAnalyticsOverviewResponse> {
  if (isMockAnalytics && typeof window === "undefined") {
    return generateMockSupplierOverview(params?.from, params?.to);
  }
  return authApiClientJson<SupplierAnalyticsOverviewResponse>(
    API_ENDPOINTS.backend.analytics.meOverview(params),
    { cache: "no-store" },
  );
}

/**
 * Lấy dữ liệu biểu đồ Tiền thuê & Tiền đã nhận của Nhà cung cấp
 * Path: GET /api/v1/analytics/me/revenue
 */
export async function getSupplierAnalyticsRevenue(
  params?: AnalyticsRevenueParams,
): Promise<SupplierAnalyticsRevenueResponse> {
  if (isMockAnalytics && typeof window === "undefined") {
    return generateMockSupplierRevenue(params?.from, params?.to, params?.granularity);
  }
  return authApiClientJson<SupplierAnalyticsRevenueResponse>(
    API_ENDPOINTS.backend.analytics.meRevenue(params),
    { cache: "no-store" },
  );
}

/**
 * Lấy thống kê số lượng listing của Nhà cung cấp từ InventoryService
 * Path: GET /api/v1/inventory/equipment-listings/statistics
 */
export async function getSupplierListingStatistics(): Promise<InventoryListingStatisticsResponse> {
  if (isMockAnalytics && typeof window === "undefined") {
    return MOCK_INVENTORY_STATISTICS_SAMPLE;
  }
  return authApiClientJson<InventoryListingStatisticsResponse>(
    API_ENDPOINTS.backend.inventory.statistics,
    { cache: "no-store" },
  );
}

export { calculateTotalListings };
