import "server-only";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import type { ApiResult } from "@/services/api-error";
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
 * Lấy 4 thẻ tổng quan Admin toàn sàn trên Server Component
 */
export async function getAdminAnalyticsOverviewServer(
  params?: AnalyticsDateRangeParams,
): Promise<ApiResult<AdminAnalyticsOverviewResponse>> {
  return serverApiResult(() =>
    serverApiJson<AdminAnalyticsOverviewResponse>(
      API_ENDPOINTS.backend.analytics.overview(params),
      "Không thể tải tổng quan KPI sàn.",
    ),
  );
}

/**
 * Lấy dữ liệu biểu đồ GMV và Phí nền tảng Admin trên Server Component
 */
export async function getAdminAnalyticsRevenueServer(
  params?: AnalyticsRevenueParams,
): Promise<ApiResult<AdminAnalyticsRevenueResponse>> {
  return serverApiResult(() =>
    serverApiJson<AdminAnalyticsRevenueResponse>(
      API_ENDPOINTS.backend.analytics.revenue(params),
      "Không thể tải dữ liệu doanh thu sàn.",
    ),
  );
}

/**
 * Lấy dữ liệu đơn hàng Admin trên Server Component
 */
export async function getAdminAnalyticsOrdersServer(
  params: { from: string; to: string },
): Promise<ApiResult<AdminAnalyticsOrdersResponse>> {
  return serverApiResult(() =>
    serverApiJson<AdminAnalyticsOrdersResponse>(
      API_ENDPOINTS.backend.analytics.orders(params),
      "Không thể tải dữ liệu đơn hàng sàn.",
    ),
  );
}

/**
 * Lấy dữ liệu top thiết bị Admin trên Server Component
 */
export async function getAdminAnalyticsEquipmentServer(
  params: AnalyticsEquipmentParams,
): Promise<ApiResult<AdminAnalyticsEquipmentResponse>> {
  return serverApiResult(() =>
    serverApiJson<AdminAnalyticsEquipmentResponse>(
      API_ENDPOINTS.backend.analytics.equipment(params),
      "Không thể tải dữ liệu top thiết bị sàn.",
    ),
  );
}

/**
 * Lấy dữ liệu hiệu suất NCC Admin trên Server Component
 */
export async function getAdminAnalyticsSuppliersServer(
  params: AnalyticsSuppliersParams,
): Promise<ApiResult<AdminAnalyticsSuppliersResponse>> {
  return serverApiResult(() =>
    serverApiJson<AdminAnalyticsSuppliersResponse>(
      API_ENDPOINTS.backend.analytics.suppliers(params),
      "Không thể tải dữ liệu nhà cung cấp sàn.",
    ),
  );
}

/**
 * Lấy 4 thẻ tổng quan của Nhà cung cấp trên Server Component
 */
export async function getSupplierAnalyticsOverviewServer(
  params?: AnalyticsDateRangeParams,
): Promise<ApiResult<SupplierAnalyticsOverviewResponse>> {
  return serverApiResult(() =>
    serverApiJson<SupplierAnalyticsOverviewResponse>(
      API_ENDPOINTS.backend.analytics.meOverview(params),
      "Không thể tải tổng quan kinh doanh của bạn.",
    ),
  );
}

/**
 * Lấy dữ liệu biểu đồ Tiền thuê & Tiền đã nhận của Nhà cung cấp trên Server Component
 */
export async function getSupplierAnalyticsRevenueServer(
  params?: AnalyticsRevenueParams,
): Promise<ApiResult<SupplierAnalyticsRevenueResponse>> {
  return serverApiResult(() =>
    serverApiJson<SupplierAnalyticsRevenueResponse>(
      API_ENDPOINTS.backend.analytics.meRevenue(params),
      "Không thể tải dữ liệu doanh số của bạn.",
    ),
  );
}

/**
 * Lấy thống kê số lượng listing của Nhà cung cấp trên Server Component
 */
export async function getSupplierListingStatisticsServer(): Promise<ApiResult<InventoryListingStatisticsResponse>> {
  return serverApiResult(() =>
    serverApiJson<InventoryListingStatisticsResponse>(
      API_ENDPOINTS.backend.inventory.statistics,
      "Không thể tải thống kê bài đăng thiết bị.",
    ),
  );
}
