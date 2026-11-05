export function formatVietnameseNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return "Vừa xong";
  }
  if (diffMin < 60) {
    return `${diffMin} phút trước`;
  }
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }
  if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export const NOTIFICATION_CATEGORY_LABELS: Record<string, string> = {
  ORDER: "Đơn hàng",
  PAYMENT: "Thanh toán",
  HANDOVER: "Bàn giao",
  RETURN: "Trả thiết bị",
};

export const NOTIFICATION_SEVERITY_LABELS: Record<string, string> = {
  INFO: "Thông tin",
  SUCCESS: "Thành công",
  WARNING: "Cảnh báo",
  ERROR: "Lỗi",
};
const GUID_PATTERN =
  /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;

export const NOTIFICATION_REASON_LABELS: Record<string, string> = {
  RENTER_CANCELLED: "Người thuê yêu cầu hủy",
  CUSTOMER_CANCELLED: "Khách hàng yêu cầu hủy",
  PAYMENT_EXPIRED: "Quá hạn thanh toán",
  ORDER_EXPIRED: "Đơn hàng đã hết hạn",
  SUPPLIER_REJECTED: "Nhà cung cấp từ chối",
  SUPPLIER_TIMEOUT: "Nhà cung cấp quá hạn xác nhận",
  SYSTEM_CANCELLED: "Hệ thống tự động hủy",
  ADMIN_CANCELLED: "Quản trị viên hủy",
};

export function formatNotificationTitle(title?: string | null): string {
  if (!title) return "";
  return title.replace(GUID_PATTERN, (match) => `${match.slice(0, 8)}...`);
}

export function formatNotificationBody(body?: string | null): string {
  if (!body) return "";
  let text = body;

  // Clean unparsed backend template placeholders
  text = text
    .replace(/\s*trước\s*\{paymentDeadline:[^}]+\}/gi, "")
    .replace(/\{[a-zA-Z0-9_]+(?::[^}]+)?\}/g, "");

  // Remove redundant backend enum tags in parentheses like (PAYMENT_EXPIRED)
  text = text.replace(
    /\s*\((?:PAYMENT_EXPIRED|ORDER_EXPIRED|RENTER_CANCELLED|SUPPLIER_TIMEOUT)\)/gi,
    "",
  );

  // Translate reason enum codes into Vietnamese
  for (const [code, label] of Object.entries(NOTIFICATION_REASON_LABELS)) {
    text = text.replace(new RegExp(`\\b${code}\\b`, "g"), label);
  }

  // Shorten raw database GUIDs
  text = text.replace(GUID_PATTERN, (match) => `${match.slice(0, 8)}...`);

  return text.replace(/\s{2,}/g, " ").trim();
}
