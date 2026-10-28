"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as signalR from "@microsoft/signalr";
import { Radio } from "lucide-react";
import {
  getAdminAnalyticsOverview,
  getAdminAnalyticsRevenue,
} from "@/services/analytics-service";
import { getDefaultAnalyticsDateRange } from "@/mocks/analytics/dashboard-mock-data";
import type {
  AdminAnalyticsOverviewResponse,
  AdminAnalyticsRevenueResponse,
  AnalyticsDataChangedEvent,
  AnalyticsGranularity,
} from "@/types/analytics";
import { AdminKpiCards } from "./admin-kpi-cards";
import { AdminRevenueChart } from "./admin-revenue-chart";
import { AdminDateFilter } from "./admin-date-filter";

export function AdminDashboardView({
  initialOverview,
  initialRevenue,
}: {
  initialOverview?: AdminAnalyticsOverviewResponse | null;
  initialRevenue?: AdminAnalyticsRevenueResponse | null;
}) {
  const queryClient = useQueryClient();
  const defaultRange = getDefaultAnalyticsDateRange();

  const [from, setFrom] = useState(initialOverview?.from ?? defaultRange.from);
  const [to, setTo] = useState(initialOverview?.to ?? defaultRange.to);
  const [granularity, setGranularity] = useState<AnalyticsGranularity>("day");
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Query nạp Overview 4 thẻ KPI
  const overviewQuery = useQuery({
    queryKey: ["admin-analytics-overview", from, to],
    queryFn: () => getAdminAnalyticsOverview({ from, to }),
    initialData:
      initialOverview &&
      initialOverview.from === from &&
      initialOverview.to === to
        ? initialOverview
        : undefined,
    refetchInterval: 60_000, // Polling dự phòng mỗi 60s theo mục 2.3 & 5 của spec
    staleTime: 30_000,
  });

  // 2. Query nạp Biểu đồ Doanh thu
  const revenueQuery = useQuery({
    queryKey: ["admin-analytics-revenue", from, to, granularity],
    queryFn: () => getAdminAnalyticsRevenue({ from, to, granularity }),
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

  // 3. Kết nối Realtime SignalR Hub (/hubs/analytics) theo Mục 4 & 5
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
          // Debounce 300ms gộp các event dồn dập theo mục 5
          clearTimeout(debounceTimerRef.current ?? undefined);
          debounceTimerRef.current = setTimeout(() => {
            if (scope === "Finance" || scope === "Rental") {
              void queryClient.invalidateQueries({
                queryKey: ["admin-analytics-overview"],
              });
              void queryClient.invalidateQueries({
                queryKey: ["admin-analytics-revenue"],
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
            queryKey: ["admin-analytics-overview"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["admin-analytics-revenue"],
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
          // Bỏ qua lỗi kết nối SignalR khi Backend chưa chạy hub, hệ thống vẫn hoạt động bằng polling 60s
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
  };

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
  };

  const isFetching = overviewQuery.isFetching || revenueQuery.isFetching;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Tiêu đề & Trạng thái kết nối */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Admin Analytics
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tổng quan quản trị sàn
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Theo dõi tổng đơn, doanh số GMV, phí sàn và số liệu thuê toàn hệ
            thống DPRental.
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
      <AdminKpiCards
        overview={overviewQuery.data}
        isLoading={overviewQuery.isLoading}
      />

      {/* Biểu đồ Doanh thu & GMV */}
      <AdminRevenueChart
        revenue={revenueQuery.data}
        granularity={granularity}
        onGranularityChange={setGranularity}
        isLoading={revenueQuery.isLoading}
      />
    </div>
  );
}
