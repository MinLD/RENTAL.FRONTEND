import { Badge } from "@/components/ui/badge";
const STATUS_LABELS: Record<string, string> = {
  PENDINGPAYMENT: "Chờ thanh toán",
  PAID: "Chờ xác nhận",
  PENDINGSUPPLIERCONFIRMATION: "Chờ xác nhận",
  AWAITINGHANDOVER: "Chờ bàn giao",
  INRENTAL: "Đang thuê",
  PENDINGSETTLEMENT: "Chờ quyết toán",
  COMPLETED: "Hoàn tất",
  REJECTED: "Đã từ chối",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
  CANCELED: "Đã hủy",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const normalized = status?.toUpperCase().replace(/[\s_-]/g, "") ?? "";
  const variant =
    normalized === "PENDINGSUPPLIERCONFIRMATION" || normalized === "PENDINGPAYMENT"
      ? "warning"
      : normalized === "REJECTED" || normalized === "CANCELLED" || normalized === "CANCELED" || normalized === "EXPIRED"
        ? "destructive"
        : normalized === "COMPLETED"
          ? "success"
          : normalized === "PAID" || normalized === "INRENTAL"
            ? "default"
            : "muted";

  return <Badge variant={variant}>{STATUS_LABELS[normalized] || status}</Badge>;
}
