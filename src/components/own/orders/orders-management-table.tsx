"use client";

import { useCallback, useEffect, useRef } from "react";
import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { useOwnOrdersController } from "@/hooks/use-own-orders-controller";
import {
  acceptSupplierOrder,
  getSupplierOrder,
  getSupplierOrders,
  rejectSupplierOrder,
} from "@/services/supplier-orders-service";
import type { SupplierOrdersFilters, SupplierOrderSummary } from "@/types/supplier-orders";
import { SUPPLIER_ORDER_STATUS_LABELS } from "@/utils/supplier-orders";
import { OrderDecisionDialog } from "./order-decision-dialog";
import { OrderDetailDrawer } from "./order-detail-drawer";
import { orderColumns } from "./order-table-columns";

export function OrdersManagementTable({ userId }: { userId: string }) {
  const listRefreshRef = useRef<(() => void) | null>(null);
  const onRefreshReady = useCallback((refresh: () => void) => {
    listRefreshRef.current = refresh;
  }, []);
  const controller = useOwnOrdersController({
    userId,
    fetchOrder: getSupplierOrder,
    acceptOrder: acceptSupplierOrder,
    rejectOrder: rejectSupplierOrder,
    onChanged: () => listRefreshRef.current?.(),
  });
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <DataTable<SupplierOrderSummary, SupplierOrdersFilters>
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={orderColumns}
        description="Xem thông tin và xác nhận các đơn thuê thiết bị của bạn"
        emptyState="Chưa có đơn thuê phù hợp."
        errorState={(error, retry) => (
          <ErrorState
            action={<Button onClick={retry} type="button" variant="secondary">Thử lại</Button>}
            className="min-h-0"
            description={error.message}
            title="Không thể tải danh sách đơn thuê"
          />
        )}
        fetchData={getSupplierOrders}
        getRowId={(order) => order.subOrderId}
        initialPageSize={20}
        onRowDoubleClick={controller.openOrder}
        pageSizeOptions={[10, 20, 50, 100]}
        renderFilters={({ filters, setFilters, refresh }) => (
          <>
            <OrdersAutoRefresh
              onRefreshReady={onRefreshReady}
              paused={Boolean(controller.action || controller.isSubmitting)}
              refresh={refresh}
            />
            <select
              aria-label="Lọc trạng thái đơn thuê"
              className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-56"
              onChange={(event) => {
                const status = Object.keys(SUPPLIER_ORDER_STATUS_LABELS).find((key) => key === event.target.value) as SupplierOrdersFilters["status"];
                setFilters({ status });
              }}
              value={filters.status ?? ""}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(SUPPLIER_ORDER_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </>
        )}
        renderRowActions={(order) => {
          const isPending = order.status === "PENDING_SUPPLIER_CONFIRMATION";
          const isRowLoading =
            controller.isLoading &&
            controller.selectedOrder?.subOrderId === order.subOrderId &&
            !controller.isDrawerOpen;

          return (
            <div className="flex justify-end gap-1">
              {isPending && (
                <>
                  <Button
                    aria-label={`Nhận đơn ${order.subOrderCode || order.subOrderId}`}
                    disabled={controller.isSubmitting || controller.isLoading}
                    onClick={(event) => {
                      event.stopPropagation();
                      void controller.openQuickDecision(order, "accept");
                    }}
                    size="sm"
                    title="Nhận đơn"
                    type="button"
                    variant="default"
                  >
                    {isRowLoading && controller.action === "accept"
                      ? "Đang nhận..."
                      : "Nhận đơn"}
                  </Button>
                  <Button
                    aria-label={`Từ chối đơn ${order.subOrderCode || order.subOrderId}`}
                    disabled={controller.isSubmitting || controller.isLoading}
                    onClick={(event) => {
                      event.stopPropagation();
                      void controller.openQuickDecision(order, "reject");
                    }}
                    size="sm"
                    title="Từ chối đơn"
                    type="button"
                    variant="default"
                  >
                    {isRowLoading && controller.action === "reject"
                      ? "Đang từ chối..."
                      : "Từ chối"}
                  </Button>
                </>
              )}
              <Button
                aria-label={`Xem chi tiết đơn ${order.subOrderCode || order.subOrderId}`}
                disabled={controller.isSubmitting}
                onClick={(event) => {
                  event.stopPropagation();
                  controller.openOrder(order);
                }}
                size="sm"
                title="Xem chi tiết đơn thuê"
                type="button"
                variant="default"
              >
                Chi tiết
              </Button>
            </div>
          );
        }}
        showCsvExport={false}
        showSearch={false}
        title="Danh sách đơn thuê"
      />

      <OrderDetailDrawer
        canDecide={controller.canDecide}
        disabledReason={controller.decisionState?.reason}
        error={controller.detailError}
        isLoading={controller.isLoading}
        isSubmitting={controller.isSubmitting}
        onAccept={() => controller.openDecision("accept")}
        onClose={controller.closeOrder}
        onRefresh={controller.refreshOrder}
        onReject={() => controller.openDecision("reject")}
        order={controller.order}
        selectedOrder={controller.isDrawerOpen ? controller.selectedOrder : null}
      />

      {controller.action && controller.order ? (
        <OrderDecisionDialog
          action={controller.action}
          canDecide={controller.canDecide}
          disabledReason={controller.decisionState?.reason || controller.detailError}
          error={controller.decisionError}
          isSubmitting={controller.isSubmitting}
          key={`${controller.order.subOrderId}:${controller.action}`}
          onClose={controller.closeDecision}
          onSubmit={controller.submitDecision}
          orderCode={controller.order.subOrderCode || controller.order.subOrderId}
        />
      ) : null}
    </div>
  );
}

function OrdersAutoRefresh({ onRefreshReady, paused, refresh }: {
  onRefreshReady: (refresh: () => void) => void;
  paused: boolean;
  refresh: () => void;
}) {
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
    onRefreshReady(refresh);
  }, [onRefreshReady, refresh]);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshRef.current();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [paused]);
  return null;
}
