import type { DataTableColumn } from "@/components/data-table";
import { ClickToCopy } from "@/components/ui/click-to-copy";
import type { SupplierOrderSummary } from "@/types/supplier-orders";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate } from "@/utils/supplier-orders";
import { OrderStatusBadge } from "./order-status-badge";

export const orderColumns: DataTableColumn<SupplierOrderSummary>[] = [
  {
    id: "subOrderCode",
    header: "Mã đơn con",
    minWidth: 200,
    width: 220,
    cell: (order) => (
      <ClickToCopy
        className="font-semibold text-foreground"
        text={order.subOrderCode || order.subOrderId}
      />
    ),
  },
  {
    id: "orderCode",
    header: "Mã đơn thuê",
    minWidth: 170,
    width: 190,
    cell: (order) => (
      <ClickToCopy
        className="font-medium text-foreground"
        text={order.orderCode}
      />
    ),
  },
  { id: "status", header: "Trạng thái", width: 170, cell: (order) => <OrderStatusBadge status={order.status} /> },
  { id: "itemCount", header: "Dòng thiết bị", width: 115, cell: (order) => order.itemCount },
  {
    id: "totalRentalAmount", header: "Tiền thuê", width: 160,
    cell: (order) => formatEquipmentListingRate(order.totalRentalAmount, order.currency),
  },
  {
    id: "totalDepositAmount", header: "Tiền cọc", width: 160,
    cell: (order) => formatEquipmentListingRate(order.totalDepositAmount, order.currency),
  },
  {
    id: "totalAmount", header: "Tổng tiền", width: 170,
    cell: (order) => <span className="font-semibold">{formatEquipmentListingRate(order.totalAmount, order.currency)}</span>,
  },
  {
    id: "createdAt",
    header: "Ngày đặt",
    minWidth: 170,
    width: 175,
    cell: (order) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground">
        {formatSupplierOrderDate(order.createdAt)}
      </span>
    ),
  },
  {
    id: "paidAt",
    header: "Ngày thanh toán",
    minWidth: 170,
    width: 175,
    cell: (order) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground">
        {formatSupplierOrderDate(order.paidAt)}
      </span>
    ),
  },
];
