"use client";

import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck2,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  InventoryListingStatisticsResponse,
  SupplierAnalyticsOverviewResponse,
} from "@/types/analytics";
import { calculateTotalListings } from "@/utils/analytics";

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function SupplierKpiCards({
  overview,
  listingStats,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  isListingStatsLoading,
  isListingStatsError,
  onRetryListingStats,
}: {
  overview?: SupplierAnalyticsOverviewResponse | null;
  listingStats?: InventoryListingStatisticsResponse | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  isListingStatsLoading?: boolean;
  isListingStatsError?: boolean;
  onRetryListingStats?: () => void;
}) {
  if (isError && !overview) {
    return (
      <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm font-medium text-foreground">
          Không thể tải tổng quan kinh doanh của bạn
        </p>
        <p className="text-xs text-muted-foreground max-w-sm">
          {errorMessage || "Đã xảy ra lỗi khi lấy số liệu tổng quan NCC. Vui lòng thử lại."}
        </p>
        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry} className="gap-1.5 text-xs">
            <RefreshCw className="size-3.5" /> Thử lại
          </Button>
        )}
      </div>
    );
  }

  const totalListings = listingStats ? calculateTotalListings(listingStats) : null;
  const paidItems = overview?.rental?.paidItems;
  const rentedQuantity = overview?.rental?.rentedQuantity;

  return (
    <div className="space-y-4">
      {/* 4 Thẻ KPI chính của Nhà cung cấp */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Thẻ 1: Lượt thuê đã thanh toán */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Lượt thuê đã thanh toán
            </span>
            <div className="grid size-9 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <ShoppingBag className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading && !overview ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {formatNumber(paidItems)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">lượt</span>
                </p>
                {rentedQuantity != null && (
                  <span className="text-xs text-muted-foreground">
                    ({formatNumber(rentedQuantity)} máy)
                  </span>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Tổng số dòng thuê của NCC trong các đơn đã trả tiền
            </p>
          </div>
        </div>

        {/* Thẻ 2: Tổng tiền thuê đã thanh toán */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tổng tiền thuê
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
              Tiền thuê từ các thiết bị của bạn (không gồm cọc)
            </p>
          </div>
        </div>

        {/* Thẻ 3: Tiền đã nhận (Payout) */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tiền đã nhận (Payout)
            </span>
            <div className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Banknote className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading && !overview ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-3xl">
                {formatCurrency(overview?.financial?.payoutCompleted)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Tiền sàn đã chuyển khoản thành công về tài khoản của bạn
            </p>
          </div>
        </div>

        {/* Thẻ 4: Tổng listing hiện có (từ InventoryService) */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tổng bài đăng (Listing)
            </span>
            <div className="grid size-9 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <PackageCheck className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            {isListingStatsLoading && totalListings == null ? (
              <Skeleton className="h-8 w-24" />
            ) : isListingStatsError && totalListings == null ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">Lỗi tải dữ liệu</span>
                {onRetryListingStats && (
                  <button
                    type="button"
                    onClick={onRetryListingStats}
                    className="text-xs text-primary hover:underline"
                  >
                    Thử lại
                  </button>
                )}
              </div>
            ) : (
              <p className="text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400 sm:text-3xl">
                {formatNumber(totalListings)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">bài</span>
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Tổng số thiết bị đang niêm yết trong kho của bạn
            </p>
          </div>
        </div>
      </div>

      {/* Dải thông số phụ trợ bổ sung cho NCC */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <Clock className="size-4 text-blue-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Đơn đang chạy</p>
            <p className="text-sm font-semibold tabular-nums">
              {isLoading && !overview ? "..." : formatNumber(overview?.orders?.activeOrders)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <FileCheck2 className="size-4 text-emerald-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Lượt hoàn tất</p>
            <p className="text-sm font-semibold tabular-nums">
              {isLoading && !overview ? "..." : formatNumber(overview?.rental?.completedRentals)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <Truck className="size-4 text-teal-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Máy đang cho thuê</p>
            <p className="text-sm font-semibold tabular-nums">
              {isLoading && !overview ? "..." : `${formatNumber(rentedQuantity)} máy`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <Coins className="size-4 text-amber-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Tiền cọc giữ</p>
            <p className="text-sm font-semibold tabular-nums truncate">
              {isLoading && !overview ? "..." : formatCurrency(overview?.financial?.depositCollected)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <CheckCircle2 className="size-4 text-purple-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Sàn sắp trả NCC</p>
            <p className="text-sm font-semibold tabular-nums truncate">
              {isLoading && !overview ? "..." : formatCurrency(overview?.financial?.supplierPayable)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3">
          <XCircle className="size-4 text-rose-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Mục bị từ chối</p>
            <p className="text-sm font-semibold tabular-nums">
              {isLoading && !overview ? "..." : formatNumber(overview?.orders?.rejectedItems)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
