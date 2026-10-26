import { Badge } from "@/components/ui/badge";
import type { SupplierOrderStatus } from "@/types/supplier-orders";
import { SUPPLIER_ORDER_STATUS_LABELS } from "@/utils/supplier-orders";

export function OrderStatusBadge({ status }: { status: SupplierOrderStatus }) {
  const variant = status === "PENDING_SUPPLIER_CONFIRMATION" || status === "PENDING_PAYMENT"
    ? "warning"
    : status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED"
      ? "destructive"
      : status === "COMPLETED" ? "success" : "default";
  return <Badge variant={variant}>{SUPPLIER_ORDER_STATUS_LABELS[status]}</Badge>;
}
