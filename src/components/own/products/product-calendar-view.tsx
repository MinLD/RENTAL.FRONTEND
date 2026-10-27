"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableState } from "@/components/data-table";
import { StatisticCards } from "@/components/layout/detail-page";
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
  const todayStats = todayCalendar.data?.days?.find((day) => day.date === today);

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
          <div className="flex items-center gap-2">
            <label
              className="shrink-0 text-xs font-medium text-muted-foreground"
              htmlFor="calendar-product-select"
            >
              Chọn sản phẩm:
            </label>
            <select
              className="h-9 min-w-48 max-w-xs cursor-pointer truncate rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
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
        </div>

        {/* Selected Product Banner */}
        {selectedProduct ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 p-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <AvatarWithSkeleton
                alt={getEquipmentListingName(selectedProduct)}
                className="size-10 shrink-0 rounded border border-border"
                fallback={
                  getEquipmentListingName(selectedProduct)
                    ?.trim()
                    .slice(0, 2)
                    .toUpperCase() || "SP"
                }
                fallbackClassName="rounded bg-muted text-xs font-bold text-foreground"
                imageClassName="rounded object-contain"
                loading="lazy"
                src={selectedProduct.thumbnailUrl}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {selectedProduct.model ? (
                    <span>Model: {selectedProduct.model}</span>
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
            <StatisticCards
              items={[
                {
                  label: "Tổng máy vật lý",
                  value: selectedProduct.totalQuantity,
                  description: "Mỗi máy có số serial riêng",
                },
                {
                  label: "Đang sử dụng hôm nay",
                  value: todayCalendar.error ? "—" : todayStats?.occupiedQuantity,
                  description: "Bao gồm lịch thuê và giữ chỗ",
                  tone: "accent",
                  isLoading: todayCalendar.isLoading,
                },
                {
                  label: "Bị chặn lịch hôm nay",
                  value: todayCalendar.error ? "—" : todayStats?.blockedQuantity,
                  description: "Máy bị chặn không thể đặt thuê",
                  tone: "warning",
                  isLoading: todayCalendar.isLoading,
                },
                {
                  label: "Khả dụng hôm nay",
                  value: todayCalendar.error ? "—" : todayStats?.availableQuantity,
                  description: "Theo lịch sử dụng của sản phẩm",
                  tone: "success",
                  isLoading: todayCalendar.isLoading,
                },
              ]}
            />

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
