"use client";

import { useCallback, useRef, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import type { ApiResult } from "@/services/api-error";
import type {
  AdminPayoutFilters,
  AdminPayoutListItem,
} from "@/types/admin-payouts";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate } from "@/utils/supplier-orders";
import { adminPayoutColumns, PAYOUT_STATUS_LABELS } from "./admin-payout-columns";
import { AdminPayoutDetailDrawer } from "./admin-payout-detail-drawer";

type AdminPayoutsTableProps = {
  fetchPayouts: (
    params: DataTableFetchParams<AdminPayoutFilters>,
  ) => Promise<ApiResult<DataTableFetchResult<AdminPayoutListItem>>>;
};

export function AdminPayoutsTable({ fetchPayouts }: AdminPayoutsTableProps) {
  const [selectedPayout, setSelectedPayout] =
    useState<AdminPayoutListItem | null>(null);

  const tableRefreshRef = useRef<(() => void) | null>(null);

  const handleOpenDetail = useCallback((item: AdminPayoutListItem) => {
    setSelectedPayout(item);
  }, []);

  const handleCloseDetail = useCallback((open: boolean) => {
    if (!open) {
      setSelectedPayout(null);
    }
  }, []);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-background">
      <DataTable<AdminPayoutListItem, AdminPayoutFilters>
        actionsHeader="Thao tác"
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={adminPayoutColumns}
        csvColumns={[
          {
            header: "Mã chi trả",
            value: (item) => item.payoutRef ?? item.payoutId,
          },
          {
            header: "Trạng thái",
            value: (item) =>
              item.status
                ? PAYOUT_STATUS_LABELS[item.status.toUpperCase()] || item.status
                : "",
          },
          {
            header: "Mã đơn thuê",
            value: (item) => item.orderCode ?? item.rentalOrderId ?? "",
          },
          { header: "Nhà cung cấp ID", value: (item) => item.supplierId ?? "" },
          {
            header: "Số tiền chi trả",
            value: (item) =>
              formatEquipmentListingRate(item.amount, item.currency || "VND"),
          },
          {
            header: "Tiền thuê gốc",
            value: (item) =>
              item.rentalAmount !== undefined
                ? formatEquipmentListingRate(
                    item.rentalAmount,
                    item.currency || "VND",
                  )
                : "",
          },
          {
            header: "Phí sàn",
            value: (item) =>
              item.platformFeeAmount !== undefined
                ? formatEquipmentListingRate(
                    item.platformFeeAmount,
                    item.currency || "VND",
                  )
                : "",
          },
          {
            header: "Khấu trừ phạt",
            value: (item) =>
              item.finalDeductionAmount !== undefined
                ? formatEquipmentListingRate(
                    item.finalDeductionAmount,
                    item.currency || "VND",
                  )
                : "",
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
            header: "Chủ tài khoản nhận",
            value: (item) => item.recipientAccountHolderName ?? "",
          },
          {
            header: "Link QR",
            value: (item) => item.qrUrl ?? "",
          },
          {
            header: "Mã chuyển khoản",
            value: (item) =>
              item.transferCode ?? item.externalTransferReference ?? "",
          },
          {
            header: "Ngày tạo",
            value: (item) => formatSupplierOrderDate(item.createdAt),
          },
          {
            header: "Ngày hoàn tất",
            value: (item) => formatSupplierOrderDate(item.completedAt),
          },
        ]}
        csvFilename="danh-sach-quyet-toan-chi-tra.csv"
        description="Tra cứu và quản lý các khoản quyết toán, chi trả tiền thuê cho nhà cung cấp từ sàn DPRental"
        emptyState="Không có khoản quyết toán nào phù hợp."
        fetchData={fetchPayouts}
        getRowId={(item) => item.payoutId}
        initialFilterParams={{ status: "ALL" }}
        initialPageSize={20}
        onRowDoubleClick={(row) => {
          handleOpenDetail(row);
        }}
        renderFilters={({ filters, setFilters }) => (
          <select
            aria-label="Lọc trạng thái chi trả"
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
            <option value="PENDING_PAYOUT">Chờ chi trả</option>
            <option value="COMPLETED">Đã hoàn tất</option>
          </select>
        )}
        renderRowActions={(row) => {
          const statusStr = String(row.status || "").toUpperCase();
          const isPending =
            statusStr.includes("PENDING") ||
            statusStr.includes("WAITING") ||
            statusStr.includes("PROCESSING") ||
            statusStr === "1";
          return (
            <div className="flex justify-end gap-1">
              <Button
                aria-label={isPending ? "Chuyển tiền chi trả" : "Xem chi tiết chi trả"}
                className="h-8 px-3 text-xs font-semibold"
                onClick={() => handleOpenDetail(row)}
                size="sm"
                title={isPending ? "Chuyển tiền chi trả" : "Xem chi tiết chi trả"}
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
        searchPlaceholder="Tìm theo mã đơn, ID nhà cung cấp..."
        title="Quyết toán tiền"
      />

      <AdminPayoutDetailDrawer
        onOpenChange={handleCloseDetail}
        open={Boolean(selectedPayout)}
        payout={selectedPayout}
      />
    </div>
  );
}
