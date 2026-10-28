"use client";

import { useState } from "react";
import { AlertCircle, Layers, Package, RefreshCw, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AdminAnalyticsEquipmentResponse,
  EquipmentRank,
} from "@/types/analytics";

export type EquipmentRankType = "types" | "listings" | "brands";

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function AdminEquipmentTable({
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: {
  data?: AdminAnalyticsEquipmentResponse | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}) {
  const [selectedTab, setSelectedTab] = useState<EquipmentRankType>("types");

  const currentList: EquipmentRank[] =
    (selectedTab === "types"
      ? data?.topEquipmentTypes
      : selectedTab === "listings"
        ? data?.topListings
        : data?.topBrands) ?? [];

  const hasData = currentList.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Top Thiết bị & Danh mục
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xếp hạng theo số lượt thuê và tổng doanh số trong kỳ (mặc định Top 10)
          </p>
        </div>

        {/* 3 tabs: Loại thiết bị, Bài đăng, Thương hiệu */}
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-1 text-xs">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
              selectedTab === "types"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSelectedTab("types")}
          >
            <Layers className="size-3.5" />
            Loại thiết bị
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
              selectedTab === "listings"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSelectedTab("listings")}
          >
            <Package className="size-3.5" />
            Bài đăng
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-medium transition-colors ${
              selectedTab === "brands"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSelectedTab("brands")}
          >
            <Tag className="size-3.5" />
            Thương hiệu
          </button>
        </div>
      </div>

      {/* Nội dung bảng */}
      <div className="mt-4 overflow-x-auto">
        {isLoading && !data ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError && !data ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-8 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">
              Không thể tải dữ liệu xếp hạng thiết bị
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {errorMessage || "Đã xảy ra lỗi khi lấy danh sách top thiết bị. Vui lòng thử lại."}
            </p>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry} className="gap-1.5 text-xs">
                <RefreshCw className="size-3.5" /> Thử lại
              </Button>
            )}
          </div>
        ) : !hasData ? (
          <div className="flex min-h-[160px] items-center justify-center py-8 text-center text-sm text-muted-foreground">
            Chưa có số liệu thiết bị nào trong khoảng thời gian này.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pl-2 pr-3 text-center w-12">#</th>
                <th className="py-2.5 px-3">Tên</th>
                <th className="py-2.5 px-3 text-right">Lượt thuê</th>
                <th className="py-2.5 px-3 text-right">SL thuê</th>
                <th className="py-2.5 px-3 text-right">GMV đã thanh toán</th>
                <th className="py-2.5 pr-2 pl-3 text-right">Hoàn tất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-normal">
              {currentList.map((item, idx) => (
                <tr key={item.id ?? `${item.name}-${idx}`} className="transition-colors hover:bg-muted/40">
                  <td className="py-2.5 pl-2 pr-3 text-center font-bold text-muted-foreground">
                    {idx === 0 ? (
                      <span className="inline-grid size-5 place-items-center rounded-full bg-amber-500/15 text-amber-600 font-bold">1</span>
                    ) : idx === 1 ? (
                      <span className="inline-grid size-5 place-items-center rounded-full bg-slate-400/20 text-slate-700 font-bold">2</span>
                    ) : idx === 2 ? (
                      <span className="inline-grid size-5 place-items-center rounded-full bg-amber-700/15 text-amber-800 font-bold">3</span>
                    ) : (
                      idx + 1
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-foreground">
                    {item.name?.trim() || "Không xác định"}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                    {formatNumber(item.rentalItemCount)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                    {formatNumber(item.rentedQuantity)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-primary">
                    {formatCurrency(item.grossRentalValue)}
                  </td>
                  <td className="py-2.5 pr-2 pl-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatNumber(item.completedCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
