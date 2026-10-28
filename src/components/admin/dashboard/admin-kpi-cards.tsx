"use client";

import {
  AlertCircle,
  BadgePercent,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck2,
  HelpCircle,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminAnalyticsOverviewResponse } from "@/types/analytics";

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function AdminKpiCards({
  overview,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: {
  overview?: AdminAnalyticsOverviewResponse | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}) {
  if (isError && !overview) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm font-medium text-foreground">
          Không thể tải tổng quan chỉ số KPI
        </p>
        <p className="text-xs text-muted-foreground max-w-sm">
          {errorMessage || "Đã xảy ra lỗi khi nạp số liệu tổng quan. Vui lòng thử lại."}
        </p>
        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry} className="gap-1.5 text-xs">
            <RefreshCw className="size-3.5" /> Thử lại
          </Button>
        )}
      </div>
    );
  }

  const totalOrders = overview?.orders?.totalOrders;
  const paidOrders = overview?.orders?.paidOrders;
  const pendingRefund = overview?.financial?.pendingRefund;

  return (
    <div className="space-y-4">
      {/* 4 Thẻ KPI chính */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Thẻ 1: Tổng đơn tạo */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tổng đơn tạo
            </span>
            <div className="grid size-9 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <ShoppingBag className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading && !overview ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {formatNumber(totalOrders)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">đơn</span>
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Tất cả các đơn thuê được tạo trong kỳ
            </p>
          </div>
        </div>

        {/* Thẻ 2: Đơn đã thanh toán (không gắn nhãn tỷ lệ chuyển đổi chéo cohort) */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Đơn đã thanh toán
            </span>
            <div className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading && !overview ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {formatNumber(paidOrders)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">đơn</span>
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Đơn đã thanh toán hóa đơn thành công trong kỳ
            </p>
          </div>
        </div>

        {/* Thẻ 3: Tổng tiền thuê đã thanh toán (GMV không gồm tiền cọc) */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tổng tiền thuê (GMV)
            </span>
            <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading && !overview ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                {formatCurrency(overview?.financial?.grossRentalValue)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Tiền thuê thực khách trả (chưa gồm tiền cọc)
            </p>
          </div>
        </div>

        {/* Thẻ 4: Phí nền tảng đã ghi nhận */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Phí nền tảng ghi nhận
            </span>
            <div className="grid size-9 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <BadgePercent className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading && !overview ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400 sm:text-3xl">
                {formatCurrency(overview?.financial?.platformRevenue)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Doanh thu thực của sàn từ các đơn đã quyết toán
            </p>
          </div>
        </div>
      </div>

      {/* Dải thông số phụ trợ bổ sung cho Admin */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-7">
        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <Clock className="size-4 text-blue-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Đang hoạt động</p>
            <p className="text-sm font-semibold tabular-nums">
              {isLoading && !overview ? "..." : formatNumber(overview?.orders?.activeOrders)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <FileCheck2 className="size-4 text-emerald-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Hoàn tất</p>
            <p className="text-sm font-semibold tabular-nums">
              {isLoading && !overview ? "..." : formatNumber(overview?.orders?.completedOrders)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <XCircle className="size-4 text-rose-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Hủy / Hết hạn</p>
            <p className="text-sm font-semibold tabular-nums">
              {isLoading && !overview
                ? "..."
                : formatNumber(
                    (overview?.orders?.cancelledOrders ?? 0) + (overview?.orders?.expiredOrders ?? 0),
                  )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <Package className="size-4 text-amber-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Lượt thuê thiết bị</p>
            <p className="text-sm font-semibold tabular-nums">
              {isLoading && !overview ? "..." : `${formatNumber(overview?.rental?.paidItems)} dòng`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <Coins className="size-4 text-teal-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Tiền cọc đã thu</p>
            <p className="text-sm font-semibold tabular-nums truncate">
              {isLoading && !overview ? "..." : formatCurrency(overview?.financial?.depositCollected)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <TrendingUp className="size-4 text-purple-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Đã Payout NCC</p>
            <p className="text-sm font-semibold tabular-nums truncate">
              {isLoading && !overview ? "..." : formatCurrency(overview?.financial?.payoutCompleted)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <HelpCircle className="size-4 text-slate-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Hoàn tiền chờ</p>
            <p className="text-sm font-semibold tabular-nums truncate">
              {isLoading && !overview
                ? "..."
                : pendingRefund === null
                  ? "Chưa có nguồn"
                  : formatCurrency(pendingRefund)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
