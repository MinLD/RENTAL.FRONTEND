"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AnalyticsGranularity,
  SupplierAnalyticsRevenueResponse,
} from "@/types/analytics";

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")} tr`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)} k`;
  }
  return String(value);
}

function formatCurrencyFull(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
}

function formatDateLabel(dateString: string, granularity: AnalyticsGranularity): string {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length < 3) return dateString;
  const [year, month, day] = parts;

  if (granularity === "month") {
    return `T${month}/${year.slice(2)}`;
  }
  return `${day}/${month}`;
}

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  granularity: AnalyticsGranularity;
};

function CustomChartTooltip({
  active,
  payload,
  label,
  granularity,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const dateTitle = label
    ? granularity === "month"
      ? `Tháng ${label.slice(5, 7)}/${label.slice(0, 4)}`
      : granularity === "week"
        ? `Tuần từ ngày ${formatDateLabel(label, granularity)}`
        : `Ngày ${formatDateLabel(label, granularity)}`
    : "";

  return (
    <div className="rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur-xs text-xs">
      <p className="font-semibold text-foreground mb-2">{dateTitle}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatCurrencyFull(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SupplierRevenueChart({
  revenue,
  granularity,
  onGranularityChange,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: {
  revenue?: SupplierAnalyticsRevenueResponse | null;
  granularity: AnalyticsGranularity;
  onGranularityChange: (granularity: AnalyticsGranularity) => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}) {
  const chartData = useMemo(() => {
    return (revenue?.buckets ?? []).map((b) => ({
      date: b.periodStart,
      grossRentalValue: b.grossRentalValue,
      supplierPayout: b.supplierPayout,
      platformRevenue: b.platformRevenue,
      refundAmount: b.refundAmount,
    }));
  }, [revenue?.buckets]);

  const hasData = chartData.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      {/* Header biểu đồ & Chọn granularity */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Biểu đồ Tiền thuê & Tiền đã nhận
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            So sánh giữa doanh số tiền thuê phát sinh và số tiền thực tế sàn đã giải ngân (Payout)
          </p>
        </div>

        {/* Nút chọn granularity: ngày / tuần / tháng */}
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-1 text-xs">
          <button
            type="button"
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              granularity === "day"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onGranularityChange("day")}
          >
            Theo ngày
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              granularity === "week"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onGranularityChange("week")}
          >
            Theo tuần
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              granularity === "month"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onGranularityChange("month")}
          >
            Theo tháng
          </button>
        </div>
      </div>

      {/* Thống kê tóm tắt 4 chỉ số tổng của kỳ */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-y border-border/70 py-3 sm:grid-cols-4">
        <div>
          <span className="text-[11px] text-muted-foreground">Tổng tiền thuê</span>
          <p className="text-sm font-bold text-primary tabular-nums">
            {isLoading ? "..." : formatCurrencyFull(revenue?.totalGrossRentalValue)}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground">Tiền đã nhận (Payout)</span>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {isLoading ? "..." : formatCurrencyFull(revenue?.totalSupplierPayout)}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground">Phí sàn đã khấu trừ</span>
          <p className="text-sm font-semibold tabular-nums text-foreground/80">
            {isLoading ? "..." : formatCurrencyFull(revenue?.totalPlatformRevenue)}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground">Tổng tiền hoàn</span>
          <p className="text-sm font-semibold tabular-nums text-foreground/80">
            {isLoading ? "..." : formatCurrencyFull(revenue?.totalRefundAmount)}
          </p>
        </div>
      </div>

      {/* Vùng vẽ biểu đồ */}
      <div className="mt-6 h-[320px] w-full">
        {isLoading && !revenue ? (
          <div className="h-full w-full flex flex-col justify-end gap-3 pb-6">
            <Skeleton className="h-[200px] w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ) : isError && !revenue ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">
              Không thể tải dữ liệu doanh số
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {errorMessage || "Đã xảy ra lỗi khi lấy biểu đồ doanh số. Vui lòng thử lại."}
            </p>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry} className="gap-1.5 text-xs">
                <RefreshCw className="size-3.5" /> Thử lại
              </Button>
            )}
          </div>
        ) : !hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Chưa có dữ liệu doanh số trong khoảng thời gian này.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSupplierGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary, #0284c7)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-primary, #0284c7)" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSupplierPayout" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatDateLabel(val, granularity)}
                fontSize={11}
                tickMargin={8}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrencyShort}
                fontSize={11}
                tickMargin={8}
                stroke="var(--muted-foreground)"
                width={48}
              />
              <Tooltip
                content={<CustomChartTooltip granularity={granularity} />}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 16, fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="grossRentalValue"
                name="Tiền thuê phát sinh"
                stroke="var(--color-primary, #0284c7)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSupplierGross)"
              />
              <Area
                type="monotone"
                dataKey="supplierPayout"
                name="Tiền đã nhận (Payout)"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSupplierPayout)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
