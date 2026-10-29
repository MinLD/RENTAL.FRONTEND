import type { DataTableColumn } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import type { AdminReturnRequestSummary } from "@/types/rental-returns";
import { formatReturnRequestStatus } from "@/utils/rental-returns";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export const adminReturnRequestColumns: DataTableColumn<AdminReturnRequestSummary>[] = [
  {
    id: "orderCode",
    header: "Mã đơn hàng",
    width: 170,
    cell: (row) => (
      <span className="block truncate font-bold text-foreground" title={row.orderCode ?? row.orderId}>
        {row.orderCode || row.orderId.slice(0, 8)}
      </span>
    ),
  },
  {
    id: "returnRequestId",
    header: "Mã yêu cầu",
    width: 130,
    cell: (row) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.returnRequestId.slice(0, 8)}
      </span>
    ),
  },
  {
    id: "status",
    header: "Trạng thái",
    width: 180,
    cell: (row) => {
      const { label, variant } = formatReturnRequestStatus(row.status);
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={variant}>{label}</Badge>
          {row.isOverdue && (
            <Badge variant="destructive">Quá hạn 24h</Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "units",
    header: "Số máy",
    width: 150,
    cell: (row) => (
      <div className="text-xs space-y-0.5">
        <span className="tabular-nums font-medium text-foreground">
          Tổng: {row.totalUnits} máy
        </span>
        {row.disputedUnits > 0 && (
          <p className="text-rose-700 font-semibold">
            Bất đồng: {row.disputedUnits}
          </p>
        )}
        {row.actionableUnits > 0 && (
          <p className="text-amber-700">Chờ xử lý: {row.actionableUnits}</p>
        )}
      </div>
    ),
  },
  {
    id: "submittedAt",
    header: "Gửi lúc",
    minWidth: 150,
    width: 160,
    cell: (row) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground">
        {formatDate(row.submittedAt)}
      </span>
    ),
  },
  {
    id: "confirmationDeadlineAt",
    header: "Hạn xác nhận",
    minWidth: 150,
    width: 160,
    cell: (row) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground">
        {formatDate(row.confirmationDeadlineAt)}
      </span>
    ),
  },
];
