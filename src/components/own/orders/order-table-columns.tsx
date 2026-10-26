import type { DataTableColumn } from "@/components/data-table";
import type { SupplierOrderSummary } from "@/types/supplier-orders";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatSupplierOrderDate } from "@/utils/supplier-orders";
import { OrderStatusBadge } from "./order-status-badge";

export const orderColumns: DataTableColumn<SupplierOrderSummary>[] = [
  {
    id: "subOrderCode", header: "Mã đơn con", width: 210,
    cell: (order) => (
      <span className="block truncate font-semibold" title={order.subOrderCode ?? order.subOrderId}>
        {order.subOrderCode || order.subOrderId}
      </span>
    ),
  },
  { id: "orderCode", header: "Mã đơn thuê", width: 185, cell: (order) => order.orderCode || "—" },
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
  { id: "createdAt", header: "Ngày đặt", width: 160, cell: (order) => formatSupplierOrderDate(order.createdAt) },
  { id: "paidAt", header: "Ngày thanh toán", width: 160, cell: (order) => formatSupplierOrderDate(order.paidAt) },
];
