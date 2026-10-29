import type { DataTableColumn } from "@/components/data-table";
import type { AdminOrderSummary } from "@/types/admin-orders";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate } from "@/utils/supplier-orders";
import { OrderStatusBadge } from "@/components/own/orders/order-status-badge";

export const adminOrderColumns: DataTableColumn<AdminOrderSummary>[] = [
  {
    id: "orderCode",
    header: "Mã đơn thuê",
    width: 190,
    cell: (order) => (
      <span className="block truncate font-bold text-foreground" title={order.orderCode ?? order.orderId}>
        {order.orderCode || order.orderId.slice(0, 8)}
      </span>
    ),
  },
  {
    id: "status",
    header: "Trạng thái",
    width: 170,
    cell: (order) => <OrderStatusBadge status={order.status} />,
  },
  {
    id: "itemCount",
    header: "Số thiết bị",
    width: 120,
    cell: (order) => (
      <span className="tabular-nums font-medium text-foreground">
        {order.itemCount} thiết bị
      </span>
    ),
  },
  {
    id: "totalAmount",
    header: "Tổng tiền",
    width: 170,
    cell: (order) => (
      <span className="font-bold text-primary tabular-nums">
        {formatEquipmentListingRate(order.totalAmount, order.currency)}
      </span>
    ),
  },
  {
    id: "invoiceRef",
    header: "Mã hóa đơn",
    width: 160,
    cell: (order) => {
      const ref = order.invoiceRef;
      if (!ref) return <span className="text-muted-foreground">—</span>;
      return (
        <span
          className="block max-w-[150px] truncate font-mono text-xs text-muted-foreground"
          title={ref}
        >
          {ref}
        </span>
      );
    },
  },
  {
    id: "createdAt",
    header: "Ngày đặt",
    minWidth: 160,
    width: 170,
    cell: (order) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground">
        {formatSupplierOrderDate(order.createdAt)}
      </span>
    ),
  },
  {
    id: "paidAt",
    header: "Ngày thanh toán",
    minWidth: 160,
    width: 170,
    cell: (order) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground">
        {formatSupplierOrderDate(order.paidAt)}
      </span>
    ),
  },
];
