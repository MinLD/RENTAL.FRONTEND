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
