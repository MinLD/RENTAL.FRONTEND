import type { DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminRefundQueueItemResponse } from "@/types/rental-returns";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate } from "@/utils/supplier-orders";
import { CheckCircle2, Clock } from "lucide-react";

export function getAdminRefundColumns(
  onConfirmRefund: (item: AdminRefundQueueItemResponse) => void
): DataTableColumn<AdminRefundQueueItemResponse>[] {
  return [
    {
      id: "orderCode",
      header: "Mã đơn thuê",
      width: 170,
      cell: (item) => (
        <span className="block truncate font-bold text-foreground" title={item.orderCode ?? item.orderId}>
          {item.orderCode || item.orderId.slice(0, 8)}
        </span>
      ),
    },
    {
      id: "equipmentName",
      header: "Thiết bị",
      width: 200,
      cell: (item) => (
        <span className="block truncate font-medium text-foreground" title={item.equipmentName ?? ""}>
          {item.equipmentName || "Thiết bị thuê"}
        </span>
      ),
    },
    {
      id: "renter",
      header: "Khách thuê",
      width: 180,
      cell: (item) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-foreground">{item.renterName || "Khách thuê"}</span>
          <span className="text-muted-foreground">{item.renterPhone || item.renterId.slice(0, 8)}</span>
        </div>
      ),
    },
    {
      id: "kind",
      header: "Loại hoàn",
      width: 140,
      cell: (item) => (
        item.kind === "FULL_REFUND" ? (
          <Badge variant="default" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
            Hoàn toàn bộ
          </Badge>
        ) : (
          <Badge variant="muted" className="font-medium border-orange-200 bg-orange-50 text-orange-700">
            Hoàn tiền cọc
          </Badge>
        )
      ),
    },
    {
      id: "refundAmount",
      header: "Số tiền cần chuyển",
      width: 160,
      cell: (item) => (
        <span className="font-bold text-primary tabular-nums">
          {formatEquipmentListingRate(item.refundAmount, "VND")}
        </span>
      ),
    },
    {
      id: "refundAccount",
      header: "Tài khoản nhận",
      width: 220,
      cell: (item) => {
        const acc = item.refundAccount as {
          bankCode?: string;
          accountNumber?: string;
          maskedAccountNumber?: string;
          accountHolderName?: string;
        };
        if (!acc || (!acc.bankCode && !acc.accountNumber && !acc.maskedAccountNumber)) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }
        return (
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-foreground">
              {acc.bankCode} · {acc.accountNumber || acc.maskedAccountNumber}
            </span>
            <span className="text-muted-foreground uppercase truncate">
              {acc.accountHolderName}
            </span>
          </div>
        );
      },
    },
    {
      id: "state",
      header: "Trạng thái",
      width: 150,
      cell: (item) => (
        item.state === "COMPLETED" ? (
          <Badge variant="success" className="flex items-center gap-1 w-fit font-semibold">
            <CheckCircle2 className="size-3.5" />
            Đã hoàn tất
          </Badge>
        ) : (
          <Badge variant="warning" className="flex items-center gap-1 w-fit font-semibold">
            <Clock className="size-3.5" />
            Chờ hoàn tiền
          </Badge>
        )
      ),
    },
    {
      id: "requestedAt",
      header: "Thời điểm yêu cầu",
      width: 150,
      cell: (item) => (
        <span className="text-xs text-muted-foreground">
          {formatSupplierOrderDate(item.requestedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      width: 140,
      cell: (item) => (
        item.state === "PENDING" ? (
          <Button
            size="sm"
            variant="default"
            onClick={() => onConfirmRefund(item)}
            className="h-8 text-xs font-medium"
          >
            Chuyển tiền
          </Button>
        ) : (
          <div className="flex flex-col text-[11px] text-muted-foreground">
            <span className="truncate font-mono" title={item.confirmation?.bankTransactionRef}>
              Mã: {item.confirmation?.bankTransactionRef || "—"}
            </span>
          </div>
        )
      ),
    },
  ];
}
