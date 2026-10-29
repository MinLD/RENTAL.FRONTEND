"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { DataTable } from "@/components/data-table";
import { getAdminRefunds, type AdminRefundFilters } from "@/services/admin-refunds-service";
import type { AdminRefundQueueItemResponse } from "@/types/rental-returns";
import { getAdminRefundColumns } from "./admin-refund-columns";
import { ConfirmRefundDialog } from "./confirm-refund-dialog";

export function AdminRefundsTable() {
  const [selectedRefundItem, setSelectedRefundItem] = useState<AdminRefundQueueItemResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const tableRefreshRef = useRef<(() => void) | null>(null);

  const handleOpenConfirm = useCallback((item: AdminRefundQueueItemResponse) => {
    setSelectedRefundItem(item);
    setIsDialogOpen(true);
  }, []);

  const handleRefreshTable = useCallback(() => {
    tableRefreshRef.current?.();
  }, []);

  const columns = useMemo(() => getAdminRefundColumns(handleOpenConfirm), [handleOpenConfirm]);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-background">
      <DataTable<AdminRefundQueueItemResponse, AdminRefundFilters>
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={columns}
        csvColumns={[
          { header: "Mã đơn thuê", value: (item) => item.orderCode ?? item.orderId },
          { header: "Khách thuê", value: "renterName" },
          { header: "SĐT khách", value: "renterPhone" },
          { header: "Thiết bị", value: "equipmentName" },
          { header: "Loại hoàn", value: "kind" },
          { header: "Số tiền hoàn", value: "refundAmount" },
          { header: "Trạng thái", value: "state" },
          { header: "Thời điểm yêu cầu", value: "requestedAt" },
        ]}
        csvFilename="danh-sach-hoan-tien-admin.csv"
        description="Quản trị viên (Admin) xem các đơn yêu cầu hoàn tiền để chuyển khoản cho người thuê"
        emptyState="Chưa có yêu cầu hoàn tiền nào phù hợp."
        fetchData={getAdminRefunds}
        getRowId={(item) => item.rentalItemId}
        initialPageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        renderFilters={({ filters, setFilters }) => (
          <select
            aria-label="Lọc trạng thái hoàn tiền"
            className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-60"
            onChange={(event) => {
              setFilters({
                ...filters,
                status: (event.target.value as "PENDING" | "COMPLETED") || undefined,
              });
            }}
            value={filters.status ?? ""}
          >
            <option value="">Tất cả trạng thái hoàn tiền</option>
            <option value="PENDING">Chờ hoàn tiền (PENDING)</option>
            <option value="COMPLETED">Đã hoàn tất (COMPLETED)</option>
          </select>
        )}
        renderToolbarActions={({ refresh }) => {
          tableRefreshRef.current = refresh;
          return null;
        }}
        title="Yêu cầu hoàn tiền"
      />

      <ConfirmRefundDialog
        item={selectedRefundItem}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleRefreshTable}
      />
    </div>
  );
}
