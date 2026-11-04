import type { DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ClickToCopy } from "@/components/ui/click-to-copy";
import type { AdminPayoutListItem } from "@/types/admin-payouts";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate } from "@/utils/supplier-orders";

export const PAYOUT_STATUS_LABELS: Record<string, string> = {
  ALL: "Tất cả",
  PENDING_PAYOUT: "Đang chờ",
  PENDING: "Đang chờ",
  WAITING: "Đang chờ",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Đã hoàn tất",
  SUCCESS: "Đã hoàn tất",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
  REJECTED: "Đã từ chối",
  UNMATCHED: "Chưa khớp",
};

export function getPayoutStatusBadge(status?: string | null) {
  if (!status) {
    return <Badge variant="muted">Không xác định</Badge>;
  }

  const str = String(status).toUpperCase();
  if (str.includes("COMPLETE") || str.includes("SUCCESS")) {
    return <Badge variant="success">Đã hoàn tất</Badge>;
  }
  if (
    str.includes("PENDING") ||
    str.includes("WAITING") ||
    str.includes("PROCESSING")
  ) {
    return <Badge variant="warning">Chờ chi trả</Badge>;
  }
  if (str.includes("FAIL") || str.includes("CANCEL") || str.includes("REJECT")) {
    return <Badge variant="destructive">Thất bại</Badge>;
  }

  return <Badge variant="muted">{str}</Badge>;
}

export const adminPayoutColumns: DataTableColumn<AdminPayoutListItem>[] = [
  {
    id: "payoutRef",
    header: "Mã chi trả",
    width: 160,
    cell: (item) => (
      <ClickToCopy
        className="font-mono font-bold text-foreground"
        display={item.payoutRef || item.payoutId}
        text={item.payoutRef || item.payoutId}
      />
    ),
  },
  {
    id: "status",
    header: "Trạng thái",
    width: 105,
    cell: (item) => getPayoutStatusBadge(item.status),
  },
  {
    id: "orderCode",
    header: "Mã đơn thuê",
    width: 150,
    cell: (item) => {
      const code = item.orderCode || item.rentalOrderId;
      return (
        <ClickToCopy
          className="font-medium text-foreground"
          display={code}
          text={code}
        />
      );
    },
  },
  {
    id: "supplierId",
    header: "Nhà cung cấp",
    width: 110,
    cell: (item) => (
      <ClickToCopy
        className="font-mono text-xs text-muted-foreground"
        display={item.supplierId ? `${item.supplierId.slice(0, 8)}...` : null}
        text={item.supplierId}
      />
    ),
  },
  {
    id: "amount",
    header: "Số tiền chi trả",
    width: 115,
    cell: (item) => (
      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
        {formatEquipmentListingRate(item.amount, item.currency || "VND")}
      </span>
    ),
  },
  {
    id: "rentalAmount",
    header: "Tiền thuê",
    width: 95,
    cell: (item) => (
      <span className="tabular-nums font-medium text-foreground">
        {item.rentalAmount !== undefined
          ? formatEquipmentListingRate(item.rentalAmount, item.currency || "VND")
          : "—"}
      </span>
    ),
  },
  {
    id: "platformFeeAmount",
    header: "Phí sàn",
    width: 80,
    cell: (item) => (
      <span className="tabular-nums text-muted-foreground">
        {item.platformFeeAmount !== undefined
          ? formatEquipmentListingRate(item.platformFeeAmount, item.currency || "VND")
          : "—"}
      </span>
    ),
  },
  {
    id: "finalDeductionAmount",
    header: "Khấu trừ",
    width: 80,
    cell: (item) => (
      <span className="tabular-nums text-muted-foreground">
        {item.finalDeductionAmount !== undefined
          ? formatEquipmentListingRate(item.finalDeductionAmount, item.currency || "VND")
          : "—"}
      </span>
    ),
  },
  {
    id: "createdAt",
    header: "Ngày tạo",
    width: 120,
    cell: (item) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground text-xs">
        {formatSupplierOrderDate(item.createdAt)}
      </span>
    ),
  },
  {
    id: "completedAt",
    header: "Ngày hoàn tất",
    width: 120,
    cell: (item) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground text-xs">
        {formatSupplierOrderDate(item.completedAt)}
      </span>
    ),
  },
];
