import type { InventoryListingStatisticsResponse } from "@/types/analytics";

/**
 * Trả về ngày hiện tại định dạng yyyy-MM-dd theo múi giờ Việt Nam (UTC+7).
 */
export function getTodayDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Cộng/trừ ngày trên chuỗi yyyy-MM-dd.
 */
export function offsetDate(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Khoảng ngày mặc định 30 ngày gần nhất: [Hôm nay - 29 ngày, Hôm nay] theo múi giờ Việt Nam.
 */
export function getDefaultAnalyticsDateRange(): { from: string; to: string } {
  const today = getTodayDateString();
  return {
    from: offsetDate(today, -29),
    to: today,
  };
}

/**
 * Kiểm tra định dạng yyyy-MM-dd và tính hợp lệ lịch (năm nhuận, ngày trong tháng).
 */
export function isValidDateString(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validate khoảng ngày theo tiêu chuẩn:
 * - Đủ cả hai đầu ngày
 * - Đúng định dạng và hợp lệ lịch
 * - to >= from
 * - Khoảng cách tối đa 366 ngày (tính cả 2 đầu ngày)
 */
export function validateAnalyticsDateRange(
  from?: string | null,
  to?: string | null,
): { valid: boolean; error?: string } {
  if (!from || !to) {
    return {
      valid: false,
      error: "Cần cung cấp đồng thời cả ngày bắt đầu và kết thúc.",
    };
  }
  if (!isValidDateString(from)) {
    return {
      valid: false,
      error: "Ngày bắt đầu không hợp lệ (định dạng YYYY-MM-DD).",
    };
  }
  if (!isValidDateString(to)) {
    return {
      valid: false,
      error: "Ngày kết thúc không hợp lệ (định dạng YYYY-MM-DD).",
    };
  }
  if (to < from) {
    return {
      valid: false,
      error: "Ngày kết thúc không được nhỏ hơn ngày bắt đầu.",
    };
  }

  const diffDays = Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  ) + 1;

  if (diffDays > 366) {
    return {
      valid: false,
      error: "Khoảng thời gian tối đa là 366 ngày.",
    };
  }

  return { valid: true };
}

/**
 * Xác thực và giải quyết khoảng ngày:
 * - Nếu thiếu cả hai: áp dụng mặc định 30 ngày.
 * - Nếu chỉ có 1 trong 2 hoặc vi phạm ràng buộc: báo lỗi INVALID_DATE_RANGE.
 */
export function resolveAnalyticsDateRange(
  from?: string | null,
  to?: string | null,
): { from: string; to: string } {
  if (!from && !to) {
    return getDefaultAnalyticsDateRange();
  }
  const validation = validateAnalyticsDateRange(from, to);
  if (!validation.valid) {
    throw new Error(`INVALID_DATE_RANGE: ${validation.error}`);
  }
  return { from: from!, to: to! };
}

/**
 * Bộ Query Key chuẩn cho Analytics, phân tách theo userId, phạm vi và tham số báo cáo.
 */
export const analyticsQueryKeys = {
  all: ["analytics"] as const,
  admin: (userId?: string) => ["analytics", "admin", userId ?? "all"] as const,
  adminOverview: (userId?: string, from?: string, to?: string) =>
    [...analyticsQueryKeys.admin(userId), "overview", from ?? "", to ?? ""] as const,
  adminRevenue: (userId?: string, from?: string, to?: string, granularity?: string) =>
    [...analyticsQueryKeys.admin(userId), "revenue", from ?? "", to ?? "", granularity ?? "day"] as const,
  adminOrders: (userId?: string, from?: string, to?: string) =>
    [...analyticsQueryKeys.admin(userId), "orders", from ?? "", to ?? ""] as const,
  adminEquipment: (userId?: string, from?: string, to?: string, limit?: number) =>
    [...analyticsQueryKeys.admin(userId), "equipment", from ?? "", to ?? "", limit ?? 10] as const,
  adminSuppliers: (userId?: string, from?: string, to?: string, page?: number, pageSize?: number) =>
    [...analyticsQueryKeys.admin(userId), "suppliers", from ?? "", to ?? "", page ?? 1, pageSize ?? 20] as const,
  supplier: (userId?: string) => ["analytics", "supplier", userId ?? "current"] as const,
  supplierOverview: (userId?: string, from?: string, to?: string) =>
    [...analyticsQueryKeys.supplier(userId), "overview", from ?? "", to ?? ""] as const,
  supplierRevenue: (userId?: string, from?: string, to?: string, granularity?: string) =>
    [...analyticsQueryKeys.supplier(userId), "revenue", from ?? "", to ?? "", granularity ?? "day"] as const,
  supplierListingStats: (userId?: string) =>
    [...analyticsQueryKeys.supplier(userId), "inventory-stats"] as const,
};

/**
 * Tính tổng số listing của Nhà cung cấp từ API Inventory.
 * Quy tắc chống đếm đôi: CHỈ tính tổng Object.values(byEquipmentType), KHÔNG cộng thêm byBrand.
 */
export function calculateTotalListings(stats: InventoryListingStatisticsResponse): number {
  return Object.values(stats.byEquipmentType || {}).reduce(
    (sum, count) => sum + count,
    0,
  );
}
