"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as signalR from "@microsoft/signalr";
import { Radio } from "lucide-react";
import {
  getSupplierAnalyticsOverview,
  getSupplierAnalyticsRevenue,
  getSupplierListingStatistics,
} from "@/services/analytics-service";
import { getDefaultAnalyticsDateRange } from "@/utils/analytics";
import type {
  AnalyticsDataChangedEvent,
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
}: {
  initialOverview?: SupplierAnalyticsOverviewResponse | null;
  initialRevenue?: SupplierAnalyticsRevenueResponse | null;
  initialListingStats?: InventoryListingStatisticsResponse | null;
}) {
  const queryClient = useQueryClient();
  const defaultRange = getDefaultAnalyticsDateRange();

  const [from, setFrom] = useState(initialOverview?.from ?? defaultRange.from);
  const [to, setTo] = useState(initialOverview?.to ?? defaultRange.to);
  const [granularity, setGranularity] = useState<AnalyticsGranularity>("day");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Query nạp Overview của NCC
  const overviewQuery = useQuery({
    queryKey: ["supplier-analytics-overview", from, to],
    queryFn: () => getSupplierAnalyticsOverview({ from, to }),
    initialData:
      initialOverview &&
      initialOverview.from === from &&
      initialOverview.to === to
        ? initialOverview
        : undefined,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // 2. Query nạp Biểu đồ Doanh thu của NCC
  const revenueQuery = useQuery({
    queryKey: ["supplier-analytics-revenue", from, to, granularity],
    queryFn: () => getSupplierAnalyticsRevenue({ from, to, granularity }),
    initialData:
      initialRevenue &&
      initialRevenue.from === from &&
      initialRevenue.to === to &&
      initialRevenue.granularity === granularity
        ? initialRevenue
        : undefined,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // 3. Query nạp Thống kê Listing từ InventoryService (độc lập bộ lọc ngày)
  const listingStatsQuery = useQuery({
    queryKey: ["supplier-inventory-statistics"],
    queryFn: () => getSupplierListingStatistics(),
    initialData: initialListingStats ?? undefined,
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  // 4. Kết nối Realtime SignalR Hub (/hubs/analytics)
  useEffect(() => {
    let connection: signalR.HubConnection | null = null;
    let isMounted = true;

    try {
      connection = new signalR.HubConnectionBuilder()
        .withUrl("/hubs/analytics", {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets,
          withCredentials: true,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.None)
        .build();

      connection.on(
        "AnalyticsDataChanged",
        (event: AnalyticsDataChangedEvent) => {
          if (!isMounted) return;
          const scope = event?.data?.scope;
          clearTimeout(debounceTimerRef.current ?? undefined);
          debounceTimerRef.current = setTimeout(() => {
            if (scope === "Finance" || scope === "Rental") {
              void queryClient.invalidateQueries({
                queryKey: ["supplier-analytics-overview"],
              });
              void queryClient.invalidateQueries({
                queryKey: ["supplier-analytics-revenue"],
              });
            }
          }, 300);
        },
      );

      connection.onreconnecting(() => {
        if (isMounted) setIsRealtimeConnected(false);
      });

      connection.onreconnected(() => {
        if (isMounted) {
          setIsRealtimeConnected(true);
          void queryClient.invalidateQueries({
            queryKey: ["supplier-analytics-overview"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["supplier-analytics-revenue"],
          });
        }
      });

      connection.onclose(() => {
        if (isMounted) setIsRealtimeConnected(false);
      });

      connection
        .start()
        .then(() => {
          if (isMounted) setIsRealtimeConnected(true);
        })
        .catch(() => {
          if (isMounted) setIsRealtimeConnected(false);
        });
    } catch {
      // Bỏ qua lỗi khởi tạo
    }

    return () => {
      isMounted = false;
      clearTimeout(debounceTimerRef.current ?? undefined);
      if (connection) {
        connection.stop().catch(() => {});
      }
    };
  }, [queryClient]);

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

  return (
    <div className="h-full overflow-y-auto space-y-6 p-4 sm:p-6 lg:p-8 pb-12">
      {/* Tiêu đề & Trạng thái kết nối */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Supplier Portal
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tổng quan kinh doanh
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Theo dõi lượt thuê, doanh thu thiết bị, tiền sàn giải ngân (Payout)
            và danh mục kho của bạn.
          </p>
        </div>
      </div>

      {/* Thanh công cụ lọc ngày & Làm mới */}
      <AdminDateFilter
        from={from}
        to={to}
        onDateChange={handleDateChange}
        onRefresh={handleRefresh}
        isLoading={isFetching}
      />

      {/* 4 Thẻ KPI chính & Dải thông số phụ */}
      <SupplierKpiCards
        overview={overviewQuery.data}
        listingStats={listingStatsQuery.data}
        isLoading={overviewQuery.isLoading || listingStatsQuery.isLoading}
      />

      {/* Biểu đồ Tiền thuê & Tiền đã nhận */}
      <SupplierRevenueChart
        revenue={revenueQuery.data}
        granularity={granularity}
        onGranularityChange={setGranularity}
        isLoading={revenueQuery.isLoading}
      />
    </div>
  );
}
