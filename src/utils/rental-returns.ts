export function normalizeEnumKey(value?: string | null): string {
  return value ? value.toUpperCase().replace(/[\s_-]/g, "") : "";
}

export function formatReturnRequestStatus(status?: string | null): {
  label: string;
  variant: "warning" | "destructive" | "success" | "default" | "muted";
} {
  const key = normalizeEnumKey(status);
  switch (key) {
    case "PENDINGSUPPLIERCONFIRMATION":
      return { label: "Chờ xác nhận", variant: "warning" };
    case "DISPUTED":
      return { label: "Có bất đồng", variant: "destructive" };
    case "CONFIRMED":
      return { label: "Đã xác nhận", variant: "success" };
    case "REJECTED":
      return { label: "Đã từ chối", variant: "destructive" };
    case "RESOLVED":
      return { label: "Đã phân xử", variant: "default" };
    default:
      return { label: status || "—", variant: "muted" };
  }
}

export function formatRentalItemStatus(status?: string | null): string {
  const key = normalizeEnumKey(status);
  const map: Record<string, string> = {
    PENDINGPAYMENT: "Chờ thanh toán",
    PAID: "Đã thanh toán",
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
  return map[key] || status || "—";
}

export function formatUnitCondition(condition?: string | null): string {
  const key = normalizeEnumKey(condition);
  if (key === "NORMAL") return "Bình thường";
  if (key === "DAMAGED") return "Hư hại";
  return condition || "—";
}

export function formatAssignmentStatus(status?: string | null): {
  label: string;
  isDamaged: boolean;
} {
  const key = normalizeEnumKey(status);
  switch (key) {
    case "RETURNEDNORMAL":
      return { label: "Đã trả bình thường", isDamaged: false };
    case "RETURNEDDAMAGED":
      return { label: "Đã trả (Hư hại)", isDamaged: true };
    case "HANDEDOVER":
      return { label: "Đã bàn giao", isDamaged: false };
    case "ASSIGNED":
      return { label: "Đã gán máy", isDamaged: false };
    case "RELEASED":
      return { label: "Đã hoàn kho", isDamaged: false };
    default:
      return { label: status || "—", isDamaged: false };
  }
}

export function formatActorRole(role?: string | null): string {
  const key = normalizeEnumKey(role);
  if (key === "RENTER") return "Khách thuê";
  if (key === "SUPPLIER") return "Nhà cung cấp";
  if (key === "ADMIN") return "Quản trị viên";
  if (key === "SYSTEM") return "Hệ thống";
  return role || "Hệ thống";
}

export function formatReturnDecision(decision?: string | null): string {
  const key = normalizeEnumKey(decision);
  if (key === "CONFIRMRECEIVED") return "Xác nhận thực nhận thiết bị";
  if (key === "REJECTREQUEST") return "Bác yêu cầu trả máy";
  return decision || "—";
}
