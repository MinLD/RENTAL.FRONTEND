"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, RefreshCw, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminAnalyticsOrdersResponse } from "@/types/analytics";

function formatDateLabel(dateString: string): string {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length < 3) return dateString;
  const [, month, day] = parts;
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
};

function CustomOrdersTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur-xs text-xs">
      <p className="font-semibold text-foreground mb-2">
        {label ? `Ngày ${formatDateLabel(label)}` : ""}
      </p>
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
              {new Intl.NumberFormat("vi-VN").format(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminOrdersChart({
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: {
  data?: AdminAnalyticsOrdersResponse | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}) {
  const chartData = useMemo(() => {
    return (data?.points ?? []).map((p) => ({
      date: p.date,
      created: p.created,
      paid: p.paid,
      completed: p.completed,
      cancelled: p.cancelled,
      expired: p.expired,
    }));
  }, [data?.points]);

  const hasData = chartData.length > 0;
  const activeOrders = data?.active ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      {/* Header & Chỉ số đơn active */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Báo cáo Vòng đời Đơn hàng
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Diễn biến số đơn tạo, thanh toán, hoàn tất, hủy và hết hạn theo ngày
          </p>
        </div>

        {/* Thẻ hiển thị số đơn đang hoạt động (active) riêng biệt */}
        <div className="inline-flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary">
          <ShoppingCart className="size-4 shrink-0" />
          <span>
            Đơn đang hoạt động tại cuối kỳ:{" "}
            <strong className="text-sm font-bold tabular-nums">
              {isLoading && !data ? "..." : new Intl.NumberFormat("vi-VN").format(activeOrders)}
            </strong>
          </span>
        </div>
      </div>

      {/* Vùng biểu đồ */}
      <div className="mt-6 h-[320px] w-full">
        {isLoading && !data ? (
          <div className="h-full w-full flex flex-col justify-end gap-3 pb-6">
            <Skeleton className="h-[200px] w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ) : isError && !data ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">
              Không thể tải dữ liệu đơn hàng
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {errorMessage || "Đã xảy ra lỗi khi lấy báo cáo đơn hàng. Vui lòng thử lại."}
            </p>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry} className="gap-1.5 text-xs">
                <RefreshCw className="size-3.5" /> Thử lại
              </Button>
            )}
          </div>
        ) : !hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Chưa có dữ liệu đơn hàng trong khoảng thời gian này.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatDateLabel}
                fontSize={11}
                tickMargin={8}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickMargin={8}
                stroke="var(--muted-foreground)"
                width={36}
                allowDecimals={false}
              />
              <Tooltip content={<CustomOrdersTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 16, fontSize: 12 }}
              />
              <Bar dataKey="created" name="Đơn tạo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name="Đã thanh toán" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Hoàn tất" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cancelled" name="Đã hủy" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expired" name="Hết hạn" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
