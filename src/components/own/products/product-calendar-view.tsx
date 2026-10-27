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
    <div className="flex h-full min-w-0 flex-col overflow-y-auto bg-muted/15">
      {/* Unified Header & Product Bar */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-4 md:px-6">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quản lý sản phẩm
              </span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs font-semibold text-primary">
                Lịch sử dụng
              </span>
            </div>

            {selectedProduct ? (
              <div className="flex items-center gap-3 pt-0.5">
                <AvatarWithSkeleton
                  alt={getEquipmentListingName(selectedProduct)}
                  className="size-11 shrink-0 rounded-lg border border-border bg-background shadow-2xs"
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-base font-bold text-foreground md:text-lg">
                      {getEquipmentListingName(selectedProduct)}
                    </h1>
                    <Badge
                      className="shrink-0 text-[10px]"
                      variant={getEquipmentListingStatusVariant(selectedProduct.status)}
                    >
                      {getEquipmentListingStatusLabel(selectedProduct.status)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
            ) : (
              <h1 className="text-base font-bold text-foreground md:text-lg">
                Lịch sử dụng & khả dụng
              </h1>
            )}
          </div>

        </div>

        {/* Today KPI Strip */}
        {selectedProduct ? (
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-emerald-900/80 dark:text-emerald-300/80">
                  Khả dụng hôm nay
                </p>
                <div className="text-lg font-bold leading-none tabular-nums text-emerald-700 dark:text-emerald-300">
                  {todayCalendar.isLoading ? (
                    <Skeleton className="mt-1 h-5 w-8" />
                  ) : (
                    todayStats?.availableQuantity ?? 0
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-blue-200/80 bg-blue-50/40 p-2.5 dark:border-blue-900/50 dark:bg-blue-950/20">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                <CalendarClock className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-blue-900/80 dark:text-blue-300/80">
                  Đang thuê / Giữ chỗ
                </p>
                <div className="text-lg font-bold leading-none tabular-nums text-blue-700 dark:text-blue-300">
                  {todayCalendar.isLoading ? (
                    <Skeleton className="mt-1 h-5 w-8" />
                  ) : (
                    todayStats?.occupiedQuantity ?? 0
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-amber-200/80 bg-amber-50/40 p-2.5 dark:border-amber-900/50 dark:bg-amber-950/20">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                <CalendarX className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-amber-900/80 dark:text-amber-300/80">
                  Bị chặn lịch
                </p>
                <div className="text-lg font-bold leading-none tabular-nums text-amber-700 dark:text-amber-300">
                  {todayCalendar.isLoading ? (
                    <Skeleton className="mt-1 h-5 w-8" />
                  ) : (
                    todayStats?.blockedQuantity ?? 0
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 shadow-2xs">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                <Boxes className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-muted-foreground">
                  Tổng máy vật lý
                </p>
                <div className="text-lg font-bold leading-none tabular-nums text-foreground">
                  {selectedProduct.totalQuantity}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-4 p-4 md:p-6">
        {selectedProduct ? (
          <>
            {todayCalendar.error ? (
              <div
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-2xs"
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

            {/* Calendar Card */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs md:p-5">
              <ProductCalendarPanel
                fetchCalendar={actions.fetchCalendar}
                key={selectedProduct.id}
                productId={selectedProduct.id}
                productSelector={
                  <select
                    aria-label="Chọn sản phẩm"
                    className="h-9 min-w-44 max-w-64 cursor-pointer truncate rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors hover:border-primary focus:border-primary"
                    id="calendar-product-select"
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    value={selectedProduct.id}
                  >
                    {initialProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {getEquipmentListingName(p)} ({p.totalQuantity} máy)
                      </option>
                    ))}
                  </select>
                }
                revision={revision}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
