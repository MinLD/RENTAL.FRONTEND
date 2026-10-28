import "server-only";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApiJson } from "@/services/server-api";
import type {
  AdminAnalyticsOverviewResponse,
  AdminAnalyticsRevenueResponse,
  AnalyticsDateRangeParams,
  AnalyticsRevenueParams,
  InventoryListingStatisticsResponse,
  SupplierAnalyticsOverviewResponse,
  SupplierAnalyticsRevenueResponse,
} from "@/types/analytics";

/**
 * Lấy 4 thẻ tổng quan Admin toàn sàn trên Server Component
 */
export async function getAdminAnalyticsOverviewServer(
  params?: AnalyticsDateRangeParams,
): Promise<AdminAnalyticsOverviewResponse | null> {
  try {
    return await serverApiJson<AdminAnalyticsOverviewResponse>(
      API_ENDPOINTS.backend.analytics.overview(params),
      "Không thể tải tổng quan KPI sàn.",
    );
  } catch {
    return null;
  }
}

/**
 * Lấy dữ liệu biểu đồ GMV và Phí nền tảng Admin trên Server Component
 */
export async function getAdminAnalyticsRevenueServer(
  params?: AnalyticsRevenueParams,
): Promise<AdminAnalyticsRevenueResponse | null> {
  try {
    return await serverApiJson<AdminAnalyticsRevenueResponse>(
      API_ENDPOINTS.backend.analytics.revenue(params),
      "Không thể tải dữ liệu doanh thu sàn.",
    );
  } catch {
    return null;
  }
}

/**
 * Lấy 4 thẻ tổng quan của Nhà cung cấp trên Server Component
 */
export async function getSupplierAnalyticsOverviewServer(
  params?: AnalyticsDateRangeParams,
): Promise<SupplierAnalyticsOverviewResponse | null> {
  try {
    return await serverApiJson<SupplierAnalyticsOverviewResponse>(
      API_ENDPOINTS.backend.analytics.meOverview(params),
      "Không thể tải tổng quan kinh doanh của bạn.",
    );
  } catch {
    return null;
  }
}

/**
 * Lấy dữ liệu biểu đồ Tiền thuê & Tiền đã nhận của Nhà cung cấp trên Server Component
 */
export async function getSupplierAnalyticsRevenueServer(
  params?: AnalyticsRevenueParams,
): Promise<SupplierAnalyticsRevenueResponse | null> {
  try {
    return await serverApiJson<SupplierAnalyticsRevenueResponse>(
      API_ENDPOINTS.backend.analytics.meRevenue(params),
      "Không thể tải dữ liệu doanh số của bạn.",
    );
  } catch {
    return null;
  }
}

/**
 * Lấy thống kê số lượng listing của Nhà cung cấp trên Server Component
 */
export async function getSupplierListingStatisticsServer(): Promise<InventoryListingStatisticsResponse | null> {
  try {
    return await serverApiJson<InventoryListingStatisticsResponse>(
      API_ENDPOINTS.backend.inventory.statistics,
      "Không thể tải thống kê bài đăng thiết bị.",
    );
  } catch {
    return null;
  }
}
