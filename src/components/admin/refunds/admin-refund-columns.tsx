import type { DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ClickToCopy } from "@/components/ui/click-to-copy";
import type { AdminManualRefundItem } from "@/types/admin-refunds";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate } from "@/utils/supplier-orders";

export function getManualRefundStatusBadge(status?: string | number | null) {
  if (status === null || status === undefined || status === "") {
    return <Badge variant="muted">Không xác định</Badge>;
  }

  const str = String(status).toUpperCase();
  if (str.includes("COMPLETE") || str.includes("SUCCESS") || str === "2") {
    return <Badge variant="success">Đã hoàn tất</Badge>;
  }
  if (str.includes("PENDING") || str.includes("WAITING") || str === "1") {
    return <Badge variant="warning">Chờ hoàn cọc</Badge>;
  }
  if (str.includes("FAIL") || str.includes("CANCEL") || str.includes("REJECT")) {
    return <Badge variant="destructive">Thất bại</Badge>;
  }

  return <Badge variant="muted">{str}</Badge>;
}

export const adminManualRefundColumns: DataTableColumn<AdminManualRefundItem>[] = [
  {
    id: "requirementRef",
    header: "Mã hoàn tiền",
    width: 160,
    cell: (item) => (
      <ClickToCopy
        className="font-mono font-bold text-foreground"
        display={item.requirementRef || item.requirementId}
        text={item.requirementRef || item.requirementId}
      />
    ),
  },
  {
    id: "status",
    header: "Trạng thái",
    width: 110,
    cell: (item) => getManualRefundStatusBadge(item.status),
  },
  {
    id: "settlementRef",
    header: "Mã quyết toán",
    width: 140,
    cell: (item) => (
      <ClickToCopy
        className="font-mono text-xs text-muted-foreground"
        display={item.settlementRef}
        text={item.settlementRef}
      />
    ),
  },
  {
    id: "renterId",
    header: "Khách thuê ID",
    width: 120,
    cell: (item) => (
      <ClickToCopy
        className="font-mono text-xs text-muted-foreground"
        display={item.renterId ? `${item.renterId.slice(0, 8)}...` : null}
        text={item.renterId}
      />
    ),
  },
  {
    id: "amount",
    header: "Số tiền cần hoàn",
    width: 120,
    cell: (item) => (
      <span className="font-bold text-primary tabular-nums">
        {formatEquipmentListingRate(item.amount, item.currency || "VND")}
      </span>
    ),
  },
  {
    id: "createdAt",
    header: "Ngày yêu cầu",
    width: 130,
    cell: (item) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground text-xs">
        {formatSupplierOrderDate(item.createdAt)}
      </span>
    ),
  },
  {
    id: "completedAt",
    header: "Ngày hoàn tất",
    width: 130,
    cell: (item) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground text-xs">
        {formatSupplierOrderDate(item.completedAt)}
      </span>
    ),
  },
];
