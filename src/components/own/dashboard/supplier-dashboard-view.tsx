"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import {
  getSupplierAnalyticsOverview,
  getSupplierAnalyticsRevenue,
  getSupplierListingStatistics,
} from "@/services/analytics-service";
import { analyticsQueryKeys, getDefaultAnalyticsDateRange } from "@/utils/analytics";
import { useAnalyticsRealtime } from "@/hooks/use-analytics-realtime";
import type { ApiResult } from "@/services/api-error";
import type {
  AnalyticsGranularity,
  InventoryListingStatisticsResponse,
  SupplierAnalyticsOverviewResponse,
  SupplierAnalyticsRevenueResponse,
} from "@/types/analytics";
import { SupplierKpiCards } from "./supplier-kpi-cards";
import { SupplierRevenueChart } from "./supplier-revenue-chart";
import { AdminDateFilter } from "@/components/admin/dashboard/admin-date-filter";

export function SupplierDashboardView({
  initialOverview,
  initialRevenue,
  initialListingStats,
  initialDateRange,
  userId,
}: {
  initialOverview?: ApiResult<SupplierAnalyticsOverviewResponse>;
  initialRevenue?: ApiResult<SupplierAnalyticsRevenueResponse>;
  initialListingStats?: ApiResult<InventoryListingStatisticsResponse>;
  initialDateRange?: { from: string; to: string };
  userId?: string;
}) {
  const defaultRange = initialDateRange ?? getDefaultAnalyticsDateRange();

  const [from, setFrom] = useState(
    initialOverview?.success ? initialOverview.data.from : defaultRange.from,
  );
  const [to, setTo] = useState(
    initialOverview?.success ? initialOverview.data.to : defaultRange.to,
  );
  const [granularity, setGranularity] = useState<AnalyticsGranularity>("day");

  // 1. Query nạp Overview của NCC
  const overviewQuery = useQuery({
    queryKey: analyticsQueryKeys.supplierOverview(userId, from, to),
    queryFn: ({ signal }) => getSupplierAnalyticsOverview({ from, to }, { signal }),
    initialData:
      initialOverview?.success &&
      initialOverview.data.from === from &&
      initialOverview.data.to === to
        ? initialOverview.data
        : undefined,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // 2. Query nạp Biểu đồ Doanh thu của NCC
  const revenueQuery = useQuery({
    queryKey: analyticsQueryKeys.supplierRevenue(userId, from, to, granularity),
    queryFn: ({ signal }) =>
      getSupplierAnalyticsRevenue({ from, to, granularity }, { signal }),
    initialData:
      initialRevenue?.success &&
      initialRevenue.data.from === from &&
      initialRevenue.data.to === to &&
      initialRevenue.data.granularity === granularity
        ? initialRevenue.data
        : undefined,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // 3. Query nạp Thống kê Listing từ InventoryService (độc lập bộ lọc ngày, làm mới độc lập)
  const listingStatsQuery = useQuery({
    queryKey: analyticsQueryKeys.supplierListingStats(userId),
    queryFn: ({ signal }) => getSupplierListingStatistics({ signal }),
    initialData: initialListingStats?.success ? initialListingStats.data : undefined,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // 4. Hook Realtime SignalR
  const { status, statusLabel, lastUpdatedAt, markDataUpdated, reconnect } =
    useAnalyticsRealtime({
      onDataChanged: (scopes) => {
        // Rental và Finance đều cập nhật overview và revenue của NCC
        if (scopes.has("Rental") || scopes.has("Finance")) {
          void overviewQuery.refetch();
          void revenueQuery.refetch();
        }
        // Listing Inventory refresh độc lập, KHÔNG gắn vào event Rental/Finance
      },
      onCatchUp: () => {
        void overviewQuery.refetch();
        void revenueQuery.refetch();
      },
    });

  // Cập nhật timestamp khi các query hoàn tất thành công
  useEffect(() => {
    if (
      overviewQuery.dataUpdatedAt ||
      revenueQuery.dataUpdatedAt ||
      listingStatsQuery.dataUpdatedAt
    ) {
      markDataUpdated();
    }
  }, [
    overviewQuery.dataUpdatedAt,
    revenueQuery.dataUpdatedAt,
    listingStatsQuery.dataUpdatedAt,
    markDataUpdated,
  ]);

  const handleRefresh = () => {
    void overviewQuery.refetch();
    void revenueQuery.refetch();
    void listingStatsQuery.refetch();
  };

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
  };

  const isFetching =
    overviewQuery.isFetching ||
    revenueQuery.isFetching ||
    listingStatsQuery.isFetching;

  const hasAnyRefreshError =
    (overviewQuery.isError && Boolean(overviewQuery.data)) ||
    (revenueQuery.isError && Boolean(revenueQuery.data)) ||
    (listingStatsQuery.isError && Boolean(listingStatsQuery.data));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Tiêu đề & Trạng thái kết nối */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tổng quan Nhà cung cấp
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi lượt cho thuê, doanh số thu về và tiến độ chi trả Payout của bạn
          </p>
        </div>

        {/* Trạng thái SignalR / Polling & Lần cập nhật cuối */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
              status === "connected"
                ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : status === "reconnecting"
                  ? "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  : "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
            }`}
          >
            <Radio
              className={`size-3 ${
                status === "connected"
                  ? "animate-pulse text-emerald-600 dark:text-emerald-400"
                  : status === "reconnecting"
                    ? "animate-spin text-amber-600 dark:text-amber-400"
                    : "text-blue-600 dark:text-blue-400"
              }`}
            />
            {statusLabel}
          </div>

          {lastUpdatedAt && (
            <span className="text-xs text-muted-foreground">
              Cập nhật: {lastUpdatedAt.toLocaleTimeString("vi-VN")}
            </span>
          )}

          {status !== "connected" && (
            <button
              type="button"
              onClick={() => void reconnect()}
              className="text-xs text-primary hover:underline font-medium"
            >
              Thử kết nối lại
            </button>
          )}
        </div>
      </div>

      {/* Thông báo khi có widget refresh lỗi nhưng vẫn giữ data cũ */}
      {hasAnyRefreshError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-50/50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
          Cập nhật mới nhất gặp sự cố mạng. Dashboard đang giữ số liệu gần nhất.
        </div>
      )}

      {/* Bộ lọc ngày dùng chung */}
      <AdminDateFilter
        from={from}
        to={to}
        onDateChange={handleDateChange}
        onRefresh={handleRefresh}
        isLoading={isFetching}
      />

      {/* 4 Thẻ KPI chính & Thông số phụ trợ */}
      <SupplierKpiCards
        overview={overviewQuery.data}
        listingStats={listingStatsQuery.data}
        isLoading={overviewQuery.isLoading}
        isError={overviewQuery.isError}
        errorMessage={overviewQuery.error?.message}
        onRetry={() => void overviewQuery.refetch()}
        isListingStatsLoading={listingStatsQuery.isLoading}
        isListingStatsError={listingStatsQuery.isError}
        onRetryListingStats={() => void listingStatsQuery.refetch()}
      />

      {/* Biểu đồ Tiền thuê & Tiền nhận Payout */}
      <SupplierRevenueChart
        revenue={revenueQuery.data}
        granularity={granularity}
        onGranularityChange={setGranularity}
        isLoading={revenueQuery.isLoading}
        isError={revenueQuery.isError}
        errorMessage={revenueQuery.error?.message}
        onRetry={() => void revenueQuery.refetch()}
      />
    </div>
  );
}
