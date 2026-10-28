"use client";

import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AdminAnalyticsSuppliersResponse,
  SupplierMetrics,
} from "@/types/analytics";

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function AdminSuppliersTable({
  data,
  page,
  pageSize,
  onPageChange,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: {
  data?: AdminAnalyticsSuppliersResponse | null;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}) {
  const items: SupplierMetrics[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasData = items.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="size-4.5 text-primary" />
            Hiệu suất & Công nợ Nhà cung cấp
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thống kê yêu cầu thuê, tỉ lệ xử lý và công nợ chi trả theo nhà cung cấp
          </p>
        </div>

        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            Tổng cộng: <strong className="font-semibold text-foreground">{formatNumber(total)}</strong> nhà cung cấp
          </span>
        )}
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
              Không thể tải danh sách nhà cung cấp
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {errorMessage || "Đã xảy ra lỗi khi lấy số liệu hiệu suất NCC. Vui lòng thử lại."}
            </p>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry} className="gap-1.5 text-xs">
                <RefreshCw className="size-3.5" /> Thử lại
              </Button>
            )}
          </div>
        ) : !hasData ? (
          <div className="flex min-h-[160px] items-center justify-center py-8 text-center text-sm text-muted-foreground">
            Chưa có số liệu nhà cung cấp nào trong khoảng thời gian này.
          </div>
        ) : (
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead>
              <tr className="border-b border-border/80 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pl-2 pr-3">Mã NCC</th>
                <th className="py-2.5 px-2.5 text-right">Tổng yêu cầu</th>
                <th className="py-2.5 px-2.5 text-right text-emerald-600 dark:text-emerald-400">Đã nhận</th>
                <th className="py-2.5 px-2.5 text-right text-rose-500">Từ chối</th>
                <th className="py-2.5 px-2.5 text-right text-amber-500">Quá hạn</th>
                <th className="py-2.5 px-2.5 text-right">Hoàn tất</th>
                <th className="py-2.5 px-2.5 text-right">Giá trị thuê</th>
                <th className="py-2.5 px-2.5 text-right">Cần trả NCC</th>
                <th className="py-2.5 pr-2 pl-2.5 text-right text-primary">Đã Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-normal">
              {items.map((supplier) => (
                <tr key={supplier.supplierId} className="transition-colors hover:bg-muted/40">
                  <td className="py-2.5 pl-2 pr-3 font-mono text-[11px] text-muted-foreground">
                    <span className="truncate max-w-[140px] inline-block align-middle" title={supplier.supplierId}>
                      {supplier.supplierId}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-right tabular-nums text-foreground font-medium">
                    {formatNumber(supplier.totalRequests)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatNumber(supplier.accepted)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right tabular-nums text-rose-500">
                    {formatNumber(supplier.rejected)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right tabular-nums text-amber-500">
                    {formatNumber(supplier.timeout)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right tabular-nums text-foreground">
                    {formatNumber(supplier.completedRentals)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right tabular-nums font-semibold text-foreground">
                    {formatCurrency(supplier.rentalValue)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                    {formatCurrency(supplier.supplierPayable)}
                  </td>
                  <td className="py-2.5 pr-2 pl-2.5 text-right tabular-nums font-bold text-primary">
                    {formatCurrency(supplier.payoutCompleted)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Phân trang Server */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-xs">
          <span className="text-muted-foreground">
            Trang <strong className="text-foreground">{page}</strong> / {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
              className="h-7 w-7 p-0"
              aria-label="Trang trước"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              className="h-7 w-7 p-0"
              aria-label="Trang sau"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
