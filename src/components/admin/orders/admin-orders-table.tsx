"use client";

import { useCallback, useRef, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  getAdminOrderDetail,
  getAdminOrders,
} from "@/services/admin-orders-service";
import type {
  AdminOrderDetail,
  AdminOrderFilters,
  AdminOrderSummary,
} from "@/types/admin-orders";
import { SUPPLIER_ORDER_STATUS_LABELS } from "@/utils/supplier-orders";
import { formatEquipmentListingDate } from "@/utils/inventory";
import { adminOrderColumns } from "./admin-order-columns";
import { AdminOrderDetailDrawer } from "./admin-order-detail-drawer";

export function AdminOrdersTable() {
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderSummary | null>(null);
  const [orderDetail, setOrderDetail] = useState<AdminOrderDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const tableRefreshRef = useRef<(() => void) | null>(null);

  const handleOpenDetail = useCallback(async (summary: AdminOrderSummary) => {
    setSelectedOrder(summary);
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const result = await getAdminOrderDetail(summary.orderId);
      if (result.success) {
        setOrderDetail(result.data);
      } else {
        setDetailError(result.error.message);
      }
    } catch {
      setDetailError("Không thể tải chi tiết đơn thuê.");
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const handleRefreshDetail = useCallback(() => {
    if (selectedOrder) {
      void handleOpenDetail(selectedOrder);
    }
  }, [selectedOrder, handleOpenDetail]);

  const handleCloseDetail = useCallback(() => {
    setSelectedOrder(null);
    setOrderDetail(null);
    setDetailError(null);
  }, []);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-background">
      <DataTable<AdminOrderSummary, AdminOrderFilters>
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={adminOrderColumns}
        csvColumns={[
          { header: "Mã đơn thuê", value: (order) => order.orderCode ?? order.orderId },
          { header: "Trạng thái", value: "status" },
          { header: "Khách thuê ID", value: "renterId" },
          { header: "Số thiết bị", value: (order) => `${order.itemCount} thiết bị` },
          { header: "Tiền thuê", value: "totalRentalAmount" },
          { header: "Tiền cọc", value: "totalDepositAmount" },
          { header: "Tổng tiền", value: "totalAmount" },
          { header: "Mã hóa đơn", value: (order) => order.invoiceRef ?? "" },
          { header: "Ngày đặt", value: (order) => formatEquipmentListingDate(order.createdAt) },
          { header: "Ngày thanh toán", value: (order) => formatEquipmentListingDate(order.paidAt) },
        ]}
        csvFilename="danh-sach-don-thue-admin.csv"
        description="Tra cứu và quản lý toàn bộ các đơn thuê thiết bị phát sinh trên sàn DPRental"
        emptyState="Chưa có đơn thuê nào phù hợp."
        fetchData={getAdminOrders}
        getRowId={(order) => order.orderId}
        initialPageSize={20}
        onRowDoubleClick={handleOpenDetail}
        pageSizeOptions={[10, 20, 50, 100]}
        renderFilters={({ filters, setFilters }) => (
          <select
            aria-label="Lọc trạng thái đơn thuê"
            className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-60"
            onChange={(event) => {
              setFilters({
                ...filters,
                status: event.target.value || undefined,
              });
            }}
            value={filters.status ?? ""}
          >
            <option value="">Tất cả trạng thái đơn</option>
            {Object.entries(SUPPLIER_ORDER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
        renderRowActions={(order) => (
          <Button
            aria-label={`Xem chi tiết đơn ${order.orderCode || order.orderId}`}
            onClick={() => void handleOpenDetail(order)}
            size="sm"
            type="button"
            variant="default"
          >
            Chi tiết
          </Button>
        )}
        renderToolbarActions={({ refresh }) => {
          tableRefreshRef.current = refresh;
          return null;
        }}
        searchDebounceMs={300}
        searchPlaceholder="Tìm kiếm theo mã đơn (ví dụ: DH-2026)..."
        title="Quản lý đơn thuê toàn sàn"
      />

      {/* Admin Order Detail Drawer */}
      <AdminOrderDetailDrawer
        error={detailError}
        isLoading={isLoadingDetail}
        onClose={handleCloseDetail}
        onRefresh={handleRefreshDetail}
        order={orderDetail}
        selectedOrder={selectedOrder}
      />
    </div>
  );
}
