import type { DataTableColumn } from "@/components/data-table";
import { ClickToCopy } from "@/components/ui/click-to-copy";
import type { AdminOrderSummary } from "@/types/admin-orders";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate } from "@/utils/supplier-orders";
import { OrderStatusBadge } from "@/components/own/orders/order-status-badge";

export const adminOrderColumns: DataTableColumn<AdminOrderSummary>[] = [
  {
    id: "orderCode",
    header: "Mã đơn thuê",
    minWidth: 150,
    width: 160,
    cell: (order) => (
      <ClickToCopy
        className="font-bold text-foreground"
        display={order.orderCode || order.orderId}
        text={order.orderCode || order.orderId}
      />
    ),
  },
  {
    id: "status",
    header: "Trạng thái",
    width: 140,
    cell: (order) => <OrderStatusBadge status={order.status} />,
  },
  {
    id: "itemCount",
    header: "Số thiết bị",
    width: 100,
    cell: (order) => (
      <span className="tabular-nums font-medium text-foreground">
        {order.itemCount} thiết bị
      </span>
    ),
  },
  {
    id: "totalAmount",
    header: "Tổng tiền",
    width: 140,
    cell: (order) => (
      <span className="font-bold text-primary tabular-nums">
        {formatEquipmentListingRate(order.totalAmount, order.currency)}
      </span>
    ),
  },
  {
    id: "invoiceRef",
    header: "Mã hóa đơn",
    minWidth: 150,
    width: 160,
    cell: (order) => (
      <ClickToCopy
        className="font-mono text-xs text-muted-foreground"
        text={order.invoiceRef}
      />
    ),
  },
  {
    id: "createdAt",
    header: "Ngày đặt",
    width: 130,
    cell: (order) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground">
        {formatSupplierOrderDate(order.createdAt)}
      </span>
    ),
  },
  {
    id: "paidAt",
    header: "Ngày thanh toán",
    width: 130,
    cell: (order) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground">
        {formatSupplierOrderDate(order.paidAt)}
      </span>
    ),
  },
];
