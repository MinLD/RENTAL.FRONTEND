"use client";

import { useCallback, useRef, useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { getAdminReturnRequests } from "@/services/admin-return-requests-service";
import type {
  AdminReturnRequestsFilters,
  AdminReturnRequestSummary,
} from "@/types/rental-returns";
import { adminReturnRequestColumns } from "./admin-return-request-columns";
import { AdminReturnRequestDetailDrawer } from "./admin-return-request-detail-drawer";

export function AdminReturnRequestsTable() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const tableRefreshRef = useRef<(() => void) | null>(null);

  const handleOpenDetail = useCallback((item: AdminReturnRequestSummary) => {
    setSelectedRequestId(item.returnRequestId);
    setIsDrawerOpen(true);
  }, []);

  const handleRefreshTable = useCallback(() => {
    tableRefreshRef.current?.();
  }, []);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-background">
      <DataTable<AdminReturnRequestSummary, AdminReturnRequestsFilters>
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={adminReturnRequestColumns}
        csvColumns={[
          { header: "Mã đơn hàng", value: (item) => item.orderCode ?? item.orderId },
          { header: "Mã yêu cầu trả", value: "returnRequestId" },
          { header: "Trạng thái", value: "status" },
          { header: "Quá hạn", value: (item) => (item.isOverdue ? "Có" : "Không") },
          { header: "Tổng số máy", value: "totalUnits" },
          { header: "Máy tranh chấp", value: "disputedUnits" },
          { header: "Máy chờ xử lý", value: "actionableUnits" },
          { header: "Thời điểm gửi", value: "submittedAt" },
          { header: "Hạn xác nhận", value: "confirmationDeadlineAt" },
        ]}
        csvFilename="danh-sach-yeu-cau-tra-may-admin.csv"
        description="Quản trị viên (Admin) xem và phân xử các yêu cầu trả thiết bị, xử lý bất đồng và quá hạn 24h"
        emptyState="Chưa có yêu cầu trả thiết bị nào phù hợp."
        fetchData={getAdminReturnRequests}
        getRowId={(item) => item.returnRequestId}
        initialPageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        renderFilters={({ filters, setFilters }) => (
          <select
            aria-label="Lọc trạng thái yêu cầu trả"
            className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-64"
            onChange={(event) => {
              const val = event.target.value;
              setFilters({
                ...filters,
                disputed: val === "disputed" ? true : undefined,
                overdue: val === "overdue" ? true : undefined,
              });
            }}
            value={filters.disputed ? "disputed" : filters.overdue ? "overdue" : ""}
          >
            <option value="">Tất cả yêu cầu trả</option>
            <option value="disputed">Có bất đồng (Disputed)</option>
            <option value="overdue">Quá hạn xác nhận (Overdue)</option>
          </select>
        )}
        renderRowActions={(item) => (
          <Button
            aria-label={`Xem chi tiết yêu cầu ${item.orderCode || item.returnRequestId}`}
            onClick={() => handleOpenDetail(item)}
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
        title="Yêu cầu trả thiết bị"
      />

      <AdminReturnRequestDetailDrawer
        onOpenChange={setIsDrawerOpen}
        onRefresh={handleRefreshTable}
        open={isDrawerOpen}
        requestId={selectedRequestId}
      />
    </div>
  );
}
