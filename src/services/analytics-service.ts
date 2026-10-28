import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import { calculateTotalListings } from "@/utils/analytics";
import type {
  AdminAnalyticsEquipmentResponse,
  AdminAnalyticsOrdersResponse,
  AdminAnalyticsOverviewResponse,
  AdminAnalyticsRevenueResponse,
  AdminAnalyticsSuppliersResponse,
  AnalyticsDateRangeParams,
  AnalyticsEquipmentParams,
  AnalyticsRevenueParams,
  AnalyticsSuppliersParams,
  InventoryListingStatisticsResponse,
  SupplierAnalyticsOverviewResponse,
  SupplierAnalyticsRevenueResponse,
} from "@/types/analytics";

/**
 * Lấy 4 thẻ tổng quan Admin toàn sàn
 * Path: GET /api/v1/analytics/overview
 */
export function getAdminAnalyticsOverview(
  params?: AnalyticsDateRangeParams,
  options?: { signal?: AbortSignal },
): Promise<AdminAnalyticsOverviewResponse> {
  return authApiClientJson<AdminAnalyticsOverviewResponse>(
    API_ENDPOINTS.backend.analytics.overview(params),
    { cache: "no-store", signal: options?.signal },
  );
}

/**
 * Lấy dữ liệu biểu đồ GMV và Phí nền tảng Admin
 * Path: GET /api/v1/analytics/revenue
 */
export function getAdminAnalyticsRevenue(
  params?: AnalyticsRevenueParams,
  options?: { signal?: AbortSignal },
): Promise<AdminAnalyticsRevenueResponse> {
  return authApiClientJson<AdminAnalyticsRevenueResponse>(
    API_ENDPOINTS.backend.analytics.revenue(params),
    { cache: "no-store", signal: options?.signal },
  );
}

/**
 * Lấy biểu đồ số đơn tạo, thanh toán, hoàn tất, hủy theo ngày của Admin
 * Path: GET /api/v1/analytics/orders
 */
export function getAdminAnalyticsOrders(
  params: { from: string; to: string },
  options?: { signal?: AbortSignal },
): Promise<AdminAnalyticsOrdersResponse> {
  return authApiClientJson<AdminAnalyticsOrdersResponse>(
    API_ENDPOINTS.backend.analytics.orders(params),
    { cache: "no-store", signal: options?.signal },
  );
}

/**
 * Lấy top loại thiết bị, listing và thương hiệu cho Admin
 * Path: GET /api/v1/analytics/equipment
 */
export function getAdminAnalyticsEquipment(
  params: AnalyticsEquipmentParams,
  options?: { signal?: AbortSignal },
): Promise<AdminAnalyticsEquipmentResponse> {
  return authApiClientJson<AdminAnalyticsEquipmentResponse>(
    API_ENDPOINTS.backend.analytics.equipment(params),
    { cache: "no-store", signal: options?.signal },
  );
}

/**
 * Lấy báo cáo hiệu suất và công nợ nhà cung cấp cho Admin
 * Path: GET /api/v1/analytics/suppliers
 */
export function getAdminAnalyticsSuppliers(
  params: AnalyticsSuppliersParams,
  options?: { signal?: AbortSignal },
): Promise<AdminAnalyticsSuppliersResponse> {
  return authApiClientJson<AdminAnalyticsSuppliersResponse>(
    API_ENDPOINTS.backend.analytics.suppliers(params),
    { cache: "no-store", signal: options?.signal },
  );
}

/**
 * Lấy 4 thẻ tổng quan của Nhà cung cấp
 * Path: GET /api/v1/analytics/me/overview
 */
export function getSupplierAnalyticsOverview(
  params?: AnalyticsDateRangeParams,
  options?: { signal?: AbortSignal },
): Promise<SupplierAnalyticsOverviewResponse> {
  return authApiClientJson<SupplierAnalyticsOverviewResponse>(
    API_ENDPOINTS.backend.analytics.meOverview(params),
    { cache: "no-store", signal: options?.signal },
  );
}

/**
 * Lấy dữ liệu biểu đồ Tiền thuê & Tiền đã nhận của Nhà cung cấp
 * Path: GET /api/v1/analytics/me/revenue
 */
export function getSupplierAnalyticsRevenue(
  params?: AnalyticsRevenueParams,
  options?: { signal?: AbortSignal },
): Promise<SupplierAnalyticsRevenueResponse> {
  return authApiClientJson<SupplierAnalyticsRevenueResponse>(
    API_ENDPOINTS.backend.analytics.meRevenue(params),
    { cache: "no-store", signal: options?.signal },
  );
}

/**
 * Lấy thống kê số lượng listing của Nhà cung cấp từ InventoryService
 * Path: GET /api/v1/inventory/equipment-listings/statistics
 */
export function getSupplierListingStatistics(
  options?: { signal?: AbortSignal },
): Promise<InventoryListingStatisticsResponse> {
  return authApiClientJson<InventoryListingStatisticsResponse>(
    API_ENDPOINTS.backend.inventory.statistics,
    { cache: "no-store", signal: options?.signal },
  );
}

export { calculateTotalListings };
