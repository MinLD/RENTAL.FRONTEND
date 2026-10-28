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
 * Xác thực khoảng ngày theo hợp đồng mục 2 của spec:
 * - Nếu thiếu cả hai: áp dụng mặc định 30 ngày.
 * - Nếu chỉ có 1 trong 2: báo lỗi INVALID_DATE_RANGE.
 * - Nếu to < from hoặc khoảng cách > 366 ngày (to - from > 365 ngày): báo lỗi.
 */
export function resolveAnalyticsDateRange(
  from?: string | null,
  to?: string | null,
): { from: string; to: string } {
  if (!from && !to) {
    return getDefaultAnalyticsDateRange();
  }
  if (!from || !to) {
    throw new Error("INVALID_DATE_RANGE: Cần cung cấp đồng thời cả 'from' và 'to', hoặc để trống cả hai.");
  }
  if (to < from) {
    throw new Error("INVALID_DATE_RANGE: Ngày kết thúc 'to' không được nhỏ hơn ngày bắt đầu 'from'.");
  }
  const diffDays = Math.floor(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000,
  ) + 1;
  if (diffDays > 366) {
    throw new Error("INVALID_DATE_RANGE: Khoảng thời gian tối đa là 366 ngày.");
  }
  return { from, to };
}

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
