"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import {
  getAdminAnalyticsEquipment,
  getAdminAnalyticsOrders,
  getAdminAnalyticsOverview,
  getAdminAnalyticsRevenue,
  getAdminAnalyticsSuppliers,
} from "@/services/analytics-service";
import { analyticsQueryKeys, getDefaultAnalyticsDateRange } from "@/utils/analytics";
import { useAnalyticsRealtime } from "@/hooks/use-analytics-realtime";
import type { ApiResult } from "@/services/api-error";
import type {
  AdminAnalyticsEquipmentResponse,
  AdminAnalyticsOrdersResponse,
  AdminAnalyticsOverviewResponse,
  AdminAnalyticsRevenueResponse,
  AdminAnalyticsSuppliersResponse,
  AnalyticsGranularity,
} from "@/types/analytics";
import { AdminKpiCards } from "./admin-kpi-cards";
import { AdminRevenueChart } from "./admin-revenue-chart";
import { AdminDateFilter } from "./admin-date-filter";
import { AdminOrdersChart } from "./admin-orders-chart";
import { AdminEquipmentTable } from "./admin-equipment-table";
import { AdminSuppliersTable } from "./admin-suppliers-table";

export function AdminDashboardView({
  initialOverview,
  initialRevenue,
  initialOrders,
  initialEquipment,
  initialSuppliers,
  initialDateRange,
  userId,
}: {
  initialOverview?: ApiResult<AdminAnalyticsOverviewResponse>;
  initialRevenue?: ApiResult<AdminAnalyticsRevenueResponse>;
  initialOrders?: ApiResult<AdminAnalyticsOrdersResponse>;
  initialEquipment?: ApiResult<AdminAnalyticsEquipmentResponse>;
  initialSuppliers?: ApiResult<AdminAnalyticsSuppliersResponse>;
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
  const [suppliersPage, setSuppliersPage] = useState(1);
  const suppliersPageSize = 20;

  // 1. Query nạp Overview 4 thẻ KPI
  const overviewQuery = useQuery({
    queryKey: analyticsQueryKeys.adminOverview(userId, from, to),
    queryFn: ({ signal }) => getAdminAnalyticsOverview({ from, to }, { signal }),
    initialData:
      initialOverview?.success &&
      initialOverview.data.from === from &&
      initialOverview.data.to === to
        ? initialOverview.data
        : undefined,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // 2. Query nạp Biểu đồ Doanh thu
  const revenueQuery = useQuery({
    queryKey: analyticsQueryKeys.adminRevenue(userId, from, to, granularity),
    queryFn: ({ signal }) =>
      getAdminAnalyticsRevenue({ from, to, granularity }, { signal }),
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

  // 3. Query nạp Báo cáo Đơn hàng
  const ordersQuery = useQuery({
    queryKey: analyticsQueryKeys.adminOrders(userId, from, to),
    queryFn: ({ signal }) => getAdminAnalyticsOrders({ from, to }, { signal }),
    initialData:
      initialOrders?.success &&
      initialOrders.data.from === from &&
      initialOrders.data.to === to
        ? initialOrders.data
        : undefined,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // 4. Query nạp Top Thiết bị
  const equipmentQuery = useQuery({
    queryKey: analyticsQueryKeys.adminEquipment(userId, from, to, 10),
    queryFn: ({ signal }) =>
      getAdminAnalyticsEquipment({ from, to, limit: 10 }, { signal }),
    initialData:
      initialEquipment?.success &&
      initialEquipment.data.from === from &&
      initialEquipment.data.to === to
        ? initialEquipment.data
        : undefined,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // 5. Query nạp Hiệu suất NCC
  const suppliersQuery = useQuery({
    queryKey: analyticsQueryKeys.adminSuppliers(
      userId,
      from,
      to,
      suppliersPage,
      suppliersPageSize,
    ),
    queryFn: ({ signal }) =>
      getAdminAnalyticsSuppliers(
        { from, to, page: suppliersPage, pageSize: suppliersPageSize },
        { signal },
      ),
    initialData:
      initialSuppliers?.success &&
      initialSuppliers.data.from === from &&
      initialSuppliers.data.to === to &&
      initialSuppliers.data.page === suppliersPage
        ? initialSuppliers.data
        : undefined,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // 6. Hook Realtime SignalR
  const { status, statusLabel, lastUpdatedAt, markDataUpdated, reconnect } =
    useAnalyticsRealtime({
      onDataChanged: (scopes) => {
        if (scopes.has("Rental")) {
          void overviewQuery.refetch();
          void revenueQuery.refetch();
          void ordersQuery.refetch();
          void equipmentQuery.refetch();
          void suppliersQuery.refetch();
        } else if (scopes.has("Finance")) {
          void overviewQuery.refetch();
          void revenueQuery.refetch();
          void suppliersQuery.refetch();
        }
      },
      onCatchUp: () => {
        void overviewQuery.refetch();
        void revenueQuery.refetch();
        void ordersQuery.refetch();
        void equipmentQuery.refetch();
        void suppliersQuery.refetch();
      },
    });

  // Cập nhật timestamp khi bất kỳ query nào tải thành công
  useEffect(() => {
    if (
      overviewQuery.dataUpdatedAt ||
      revenueQuery.dataUpdatedAt ||
      ordersQuery.dataUpdatedAt ||
      equipmentQuery.dataUpdatedAt ||
      suppliersQuery.dataUpdatedAt
    ) {
      markDataUpdated();
    }
  }, [
    overviewQuery.dataUpdatedAt,
    revenueQuery.dataUpdatedAt,
    ordersQuery.dataUpdatedAt,
    equipmentQuery.dataUpdatedAt,
    suppliersQuery.dataUpdatedAt,
    markDataUpdated,
  ]);

  const handleRefresh = () => {
    void overviewQuery.refetch();
    void revenueQuery.refetch();
    void ordersQuery.refetch();
    void equipmentQuery.refetch();
    void suppliersQuery.refetch();
  };

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
    setSuppliersPage(1); // Đổi ngày đưa trang NCC về 1 theo yêu cầu
  };

  const isFetching =
    overviewQuery.isFetching ||
    revenueQuery.isFetching ||
    ordersQuery.isFetching ||
    equipmentQuery.isFetching ||
    suppliersQuery.isFetching;

  const hasAnyRefreshError =
    (overviewQuery.isError && Boolean(overviewQuery.data)) ||
    (revenueQuery.isError && Boolean(revenueQuery.data)) ||
    (ordersQuery.isError && Boolean(ordersQuery.data)) ||
    (equipmentQuery.isError && Boolean(equipmentQuery.data)) ||
    (suppliersQuery.isError && Boolean(suppliersQuery.data));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Tiêu đề & Trạng thái kết nối */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tổng quan sàn & Hiệu suất
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Báo cáo tổng hợp số liệu kinh doanh, doanh số cho thuê và sức khỏe tài chính toàn sàn
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

      {/* 4 Thẻ KPI chính */}
      <AdminKpiCards
        overview={overviewQuery.data}
        isLoading={overviewQuery.isLoading}
        isError={overviewQuery.isError}
        errorMessage={overviewQuery.error?.message}
        onRetry={() => void overviewQuery.refetch()}
      />

      {/* Biểu đồ Doanh thu & GMV */}
      <AdminRevenueChart
        revenue={revenueQuery.data}
        granularity={granularity}
        onGranularityChange={setGranularity}
        isLoading={revenueQuery.isLoading}
        isError={revenueQuery.isError}
        errorMessage={revenueQuery.error?.message}
        onRetry={() => void revenueQuery.refetch()}
      />

      {/* Báo cáo Vòng đời Đơn hàng */}
      <AdminOrdersChart
        data={ordersQuery.data}
        isLoading={ordersQuery.isLoading}
        isError={ordersQuery.isError}
        errorMessage={ordersQuery.error?.message}
        onRetry={() => void ordersQuery.refetch()}
      />

      {/* Top Thiết bị & Danh mục */}
      <AdminEquipmentTable
        data={equipmentQuery.data}
        isLoading={equipmentQuery.isLoading}
        isError={equipmentQuery.isError}
        errorMessage={equipmentQuery.error?.message}
        onRetry={() => void equipmentQuery.refetch()}
      />

      {/* Báo cáo Hiệu suất NCC */}
      <AdminSuppliersTable
        data={suppliersQuery.data}
        page={suppliersPage}
        pageSize={suppliersPageSize}
        onPageChange={setSuppliersPage}
        isLoading={suppliersQuery.isLoading}
        isError={suppliersQuery.isError}
        errorMessage={suppliersQuery.error?.message}
        onRetry={() => void suppliersQuery.refetch()}
      />
    </div>
  );
}
