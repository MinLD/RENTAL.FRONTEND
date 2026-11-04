"use client";

import { useCallback, useRef, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { getAdminManualRefundsAction } from "@/services/actions/admin-refunds-actions";
import type {
  AdminManualRefundFilters,
  AdminManualRefundItem,
} from "@/types/admin-refunds";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate } from "@/utils/supplier-orders";
import { adminManualRefundColumns } from "./admin-refund-columns";
import { AdminRefundDetailDrawer } from "./admin-refund-detail-drawer";

export function AdminRefundsTable() {
  const [selectedRefundItem, setSelectedRefundItem] =
    useState<AdminManualRefundItem | null>(null);
  const tableRefreshRef = useRef<(() => void) | null>(null);

  const handleOpenDetail = useCallback((item: AdminManualRefundItem) => {
    setSelectedRefundItem(item);
  }, []);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-background">
      <DataTable<AdminManualRefundItem, AdminManualRefundFilters>
        actionsHeader="Thao tác"
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={adminManualRefundColumns}
        csvColumns={[
          {
            header: "Mã hoàn tiền",
            value: (item) => item.requirementRef ?? item.requirementId,
          },
          {
            header: "Trạng thái",
            value: (item) => {
              const str = String(item.status || "").toUpperCase();
              if (str.includes("COMPLETE") || str.includes("SUCCESS") || str === "2") return "Đã hoàn tất";
              if (str.includes("PENDING") || str.includes("WAITING") || str === "1") return "Chờ hoàn cọc";
              return str || "—";
            },
          },
          { header: "Mã quyết toán", value: (item) => item.settlementRef ?? "" },
          { header: "Khách thuê ID", value: (item) => item.renterId ?? "" },
          {
            header: "Số tiền hoàn",
            value: (item) =>
              formatEquipmentListingRate(item.amount, item.currency || "VND"),
          },
          {
            header: "Ngân hàng nhận",
            value: (item) => item.recipientBankCode ?? "",
          },
          {
            header: "Số tài khoản nhận",
            value: (item) => item.recipientAccountNumber ?? "",
          },
          {
            header: "Chủ tài khoản",
            value: (item) => item.recipientAccountHolderName ?? "",
          },
          { header: "Mã chuyển khoản", value: (item) => item.transferCode ?? "" },
          {
            header: "Ngày yêu cầu",
            value: (item) => formatSupplierOrderDate(item.createdAt),
          },
          {
            header: "Ngày hoàn tất",
            value: (item) => formatSupplierOrderDate(item.completedAt),
          },
        ]}
        csvFilename="danh-sach-hoan-tien-coc.csv"
        description="Quản trị viên (Admin) xem và quét mã QR chuyển khoản hoàn cọc cho người thuê"
        emptyState="Chưa có yêu cầu hoàn cọc nào phù hợp."
        fetchData={getAdminManualRefundsAction}
        getRowId={(item) => item.requirementId}
        initialFilterParams={{ status: "ALL" }}
        initialPageSize={20}
        onRowDoubleClick={handleOpenDetail}
        pageSizeOptions={[10, 20, 50, 100]}
        renderFilters={({ filters, setFilters }) => (
          <select
            aria-label="Lọc trạng thái hoàn tiền"
            className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-48"
            onChange={(event) => {
              setFilters({
                ...filters,
                status: event.target.value || undefined,
              });
            }}
            value={filters.status ?? "ALL"}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ hoàn cọc</option>
            <option value="COMPLETED">Đã hoàn tất</option>
          </select>
        )}
        renderRowActions={(row) => {
          const statusStr = String(row.status || "").toUpperCase();
          const isPending =
            statusStr.includes("PENDING") ||
            statusStr.includes("WAITING") ||
            statusStr === "1";

          return (
            <div className="flex justify-end gap-1">
              <Button
                aria-label={isPending ? "Chuyển tiền hoàn cọc" : "Xem chi tiết hoàn cọc"}
                className="h-8 px-3 text-xs font-semibold"
                onClick={() => handleOpenDetail(row)}
                size="sm"
                type="button"
                variant="default"
              >
                {isPending ? "Chuyển tiền" : "Chi tiết"}
              </Button>
            </div>
          );
        }}
        renderToolbarActions={({ refresh }) => {
          tableRefreshRef.current = refresh;
          return null;
        }}
        searchPlaceholder="Tìm theo mã hoàn tiền hoặc từ khóa..."
        title="Hoàn tiền cọc"
      />

      <AdminRefundDetailDrawer
        item={selectedRefundItem}
        onOpenChange={(open) => {
          if (!open) setSelectedRefundItem(null);
        }}
        open={Boolean(selectedRefundItem)}
      />
    </div>
  );
}
