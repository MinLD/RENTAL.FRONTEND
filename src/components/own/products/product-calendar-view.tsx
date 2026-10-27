"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Boxes, CalendarClock, CalendarX, CheckCircle2, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableState } from "@/components/data-table";
import { useApiResource } from "@/hooks/use-api-resource";
import type { EquipmentListing } from "@/types/inventory";
import { getTodayDate } from "@/utils/calendar";
import {
  getEquipmentListingName,
  getEquipmentListingStatusLabel,
  getEquipmentListingStatusVariant,
} from "@/utils/inventory";
import { ProductCalendarPanel } from "./product-calendar-panel";
import type { ProductPageActions } from "./product-management-types";

type ProductCalendarViewProps = {
  actions: ProductPageActions;
  initialProducts: EquipmentListing[];
};

export function ProductCalendarView({
  actions,
  initialProducts,
}: ProductCalendarViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryProductId = searchParams.get("productId") ?? "";
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    if (queryProductId && initialProducts.some((p) => p.id === queryProductId)) {
      return queryProductId;
    }
    return initialProducts[0]?.id ?? "";
  });

  const [revision, setRevision] = useState(0);
  const today = useMemo(() => getTodayDate(), []);

  const selectedProduct = useMemo(
    () => initialProducts.find((p) => p.id === selectedProductId) ?? initialProducts[0] ?? null,
    [initialProducts, selectedProductId],
  );

  const handleSelectProduct = useCallback(
    (productId: string) => {
      setSelectedProductId(productId);
      const params = new URLSearchParams(searchParams.toString());
      params.set("productId", productId);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const requestToday = useCallback(
    () => actions.fetchCalendar(selectedProductId, { from: today, to: today }),
    [actions, selectedProductId, today],
  );

  const todayCalendar = useApiResource(requestToday, Boolean(selectedProduct));
  const todayStats = todayCalendar.data?.days?.find((day: { date: string }) => day.date === today);

  if (initialProducts.length === 0) {
    return (
      <div className="grid h-full min-h-64 place-items-center p-6">
        <DataTableState message="Không có sản phẩm nào để hiển thị lịch sử dụng." />
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-y-auto bg-background">
      {/* Header bar */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-3 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quản lý sản phẩm
              </span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs font-semibold text-primary">
                Lịch sử dụng
              </span>
            </div>
            <h1 className="mt-0.5 text-lg font-bold text-foreground md:text-xl">
              Lịch sử dụng & khả dụng
            </h1>
          </div>

          {/* Product selector dropdown */}
          {initialProducts.length > 1 ? (
            <div className="flex items-center gap-2">
              <label
                className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="calendar-product-select"
              >
                Sản phẩm:
              </label>
              <select
                className="h-9 min-w-48 max-w-xs cursor-pointer truncate rounded-md border border-input bg-background px-3 text-sm font-semibold shadow-2xs outline-none transition-colors hover:border-primary focus:border-primary"
                id="calendar-product-select"
                onChange={(e) => handleSelectProduct(e.target.value)}
                value={selectedProduct?.id ?? ""}
              >
                {initialProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getEquipmentListingName(p)} ({p.totalQuantity} máy)
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {/* Selected Product Banner */}
        {selectedProduct ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/25 p-3">
            <div className="flex min-w-0 items-center gap-3.5">
              <AvatarWithSkeleton
                alt={getEquipmentListingName(selectedProduct)}
                className="size-11 shrink-0 rounded-lg border border-border shadow-2xs"
                fallback={
                  getEquipmentListingName(selectedProduct)
                    ?.trim()
                    .slice(0, 2)
                    .toUpperCase() || "SP"
                }
                fallbackClassName="rounded-lg bg-muted text-xs font-bold text-foreground"
                imageClassName="rounded-lg object-contain"
                loading="lazy"
                src={selectedProduct.thumbnailUrl}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="truncate text-sm font-bold text-foreground">
                    {getEquipmentListingName(selectedProduct)}
                  </span>
                  <Badge
                    className="shrink-0 text-[10px]"
                    variant={getEquipmentListingStatusVariant(selectedProduct.status)}
                  >
                    {getEquipmentListingStatusLabel(selectedProduct.status)}
                  </Badge>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {selectedProduct.model ? (
                    <span>
                      Model: <span className="font-medium text-foreground">{selectedProduct.model}</span>
                    </span>
                  ) : null}
                  <span>
                    Tổng máy:{" "}
                    <strong className="font-semibold text-foreground">
                      {selectedProduct.totalQuantity}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {selectedProduct ? (
          <>
            {/* Today statistic cards */}
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              <div className="flex min-w-0 flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Tổng máy vật lý</span>
                  <span className="grid size-8 place-items-center rounded-lg bg-muted/70 text-muted-foreground">
                    <Boxes className="size-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold tabular-nums text-foreground">
                    {selectedProduct.totalQuantity}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Mỗi máy có số serial riêng</p>
                </div>
              </div>

              <div className="flex min-w-0 flex-col justify-between rounded-xl border border-blue-200/70 bg-blue-50/30 p-4 shadow-2xs dark:border-blue-900/50 dark:bg-blue-950/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-blue-900 dark:text-blue-200">Đang thuê hôm nay</span>
                  <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    <CalendarClock className="size-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-300">
                    {todayCalendar.isLoading ? <Skeleton className="h-8 w-12" /> : (todayStats?.occupiedQuantity ?? 0)}
                  </div>
                  <p className="mt-0.5 text-[11px] text-blue-700/70 dark:text-blue-300/70">Bao gồm lịch thuê & giữ chỗ</p>
                </div>
              </div>

              <div className="flex min-w-0 flex-col justify-between rounded-xl border border-amber-200/70 bg-amber-50/30 p-4 shadow-2xs dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-amber-900 dark:text-amber-200">Bị chặn lịch hôm nay</span>
                  <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                    <CalendarX className="size-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
                    {todayCalendar.isLoading ? <Skeleton className="h-8 w-12" /> : (todayStats?.blockedQuantity ?? 0)}
                  </div>
                  <p className="mt-0.5 text-[11px] text-amber-700/70 dark:text-amber-300/70">Bảo trì hoặc khóa lịch</p>
                </div>
              </div>

              <div className="flex min-w-0 flex-col justify-between rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-4 shadow-2xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-emerald-900 dark:text-emerald-200">Khả dụng hôm nay</span>
                  <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <CheckCircle2 className="size-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                    {todayCalendar.isLoading ? <Skeleton className="h-8 w-12" /> : (todayStats?.availableQuantity ?? 0)}
                  </div>
                  <p className="mt-0.5 text-[11px] text-emerald-700/70 dark:text-emerald-300/70">Sẵn sàng để cho thuê</p>
                </div>
              </div>
            </div>

            {todayCalendar.error ? (
              <div
                className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                role="alert"
              >
                <span>Chưa tải được thống kê hôm nay: {todayCalendar.error}</span>
                <Button
                  onClick={() => {
                    setRevision((r) => r + 1);
                    void todayCalendar.refresh();
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <RefreshCw className="size-3" />
                  Thử lại
                </Button>
              </div>
            ) : null}

            {/* Calendar Panel */}
            <div className="rounded-lg border border-border bg-card p-4 md:p-6">
              <ProductCalendarPanel
                fetchCalendar={actions.fetchCalendar}
                key={selectedProduct.id}
                productId={selectedProduct.id}
                revision={revision}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
