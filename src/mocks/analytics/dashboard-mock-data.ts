import type {
  AdminAnalyticsOverviewResponse,
  AdminAnalyticsRevenueResponse,
  AnalyticsDataChangedEvent,
  AnalyticsGranularity,
  AnalyticsRevenueBucket,
  InventoryListingStatisticsResponse,
  SupplierAnalyticsOverviewResponse,
  SupplierAnalyticsRevenueResponse,
} from "@/types/analytics";

/**
 * Mẫu dữ liệu tĩnh chuẩn từ đặc tả docs/dashboard-v1-api-specs.md
 */
export const MOCK_ADMIN_OVERVIEW_SAMPLE: AdminAnalyticsOverviewResponse = {
  from: "2026-10-01",
  to: "2026-10-05",
  currency: "VND",
  orders: {
    totalOrders: 25,
    paidOrders: 20,
    activeOrders: 6,
    completedOrders: 15,
    cancelledOrders: 2,
    expiredOrders: 1,
    rejectedItems: 2,
  },
  financial: {
    grossRentalValue: 43500000.0,
    completedRentalValue: 32000000.0,
    depositCollected: 95000000.0,
    platformRevenue: 4350000.0,
    deductionAmount: 500000.0,
    refundAmount: 1500000.0,
    supplierPayable: 39650000.0,
    payoutCompleted: 36000000.0,
    pendingRefund: null,
  },
  rental: {
    paidItems: 28,
    rentedQuantity: 42,
    completedRentals: 20,
  },
};

export const MOCK_ADMIN_REVENUE_SAMPLE: AdminAnalyticsRevenueResponse = {
  from: "2026-10-01",
  to: "2026-10-05",
  granularity: "day",
  currency: "VND",
  totalPlatformRevenue: 4350000.0,
  totalGrossRentalValue: 43500000.0,
  totalRefundAmount: 1500000.0,
  totalSupplierPayout: 36000000.0,
  buckets: [
    {
      periodStart: "2026-10-01",
      platformRevenue: 1200000.0,
      grossRentalValue: 12000000.0,
      refundAmount: 0.0,
      supplierPayout: 8500000.0,
    },
    {
      periodStart: "2026-10-02",
      platformRevenue: 950000.0,
      grossRentalValue: 9500000.0,
      refundAmount: 500000.0,
      supplierPayout: 11000000.0,
    },
    {
      periodStart: "2026-10-03",
      platformRevenue: 0.0,
      grossRentalValue: 0.0,
      refundAmount: 0.0,
      supplierPayout: 0.0,
    },
    {
      periodStart: "2026-10-04",
      platformRevenue: 1400000.0,
      grossRentalValue: 14000000.0,
      refundAmount: 1000000.0,
      supplierPayout: 9500000.0,
    },
    {
      periodStart: "2026-10-05",
      platformRevenue: 800000.0,
      grossRentalValue: 8000000.0,
      refundAmount: 0.0,
      supplierPayout: 7000000.0,
    },
  ],
};

export const MOCK_SUPPLIER_OVERVIEW_SAMPLE: SupplierAnalyticsOverviewResponse = {
  from: "2026-10-01",
  to: "2026-10-05",
  currency: "VND",
  orders: {
    totalOrders: 8,
    paidOrders: 6,
    activeOrders: 2,
    completedOrders: 5,
    cancelledOrders: 0,
    expiredOrders: 0,
    rejectedItems: 1,
  },
  financial: {
    grossRentalValue: 14500000.0,
    completedRentalValue: 11000000.0,
    depositCollected: 35000000.0,
    platformRevenue: 1450000.0,
    deductionAmount: 200000.0,
    refundAmount: 0.0,
    supplierPayable: 13250000.0,
    payoutCompleted: 12000000.0,
    pendingRefund: null,
  },
  rental: {
    paidItems: 8,
    rentedQuantity: 14,
    completedRentals: 6,
  },
};

export const MOCK_SUPPLIER_REVENUE_SAMPLE: SupplierAnalyticsRevenueResponse = {
  from: "2026-10-01",
  to: "2026-10-05",
  granularity: "day",
  currency: "VND",
  totalPlatformRevenue: 1450000.0,
  totalGrossRentalValue: 14500000.0,
  totalRefundAmount: 0.0,
  totalSupplierPayout: 12000000.0,
  buckets: [
    {
      periodStart: "2026-10-01",
      platformRevenue: 300000.0,
      grossRentalValue: 3000000.0,
      refundAmount: 0.0,
      supplierPayout: 0.0,
    },
    {
      periodStart: "2026-10-02",
      platformRevenue: 450000.0,
      grossRentalValue: 4500000.0,
      refundAmount: 0.0,
      supplierPayout: 5000000.0,
    },
    {
      periodStart: "2026-10-03",
      platformRevenue: 0.0,
      grossRentalValue: 0.0,
      refundAmount: 0.0,
      supplierPayout: 0.0,
    },
    {
      periodStart: "2026-10-04",
      platformRevenue: 500000.0,
      grossRentalValue: 5000000.0,
      refundAmount: 0.0,
      supplierPayout: 4000000.0,
    },
    {
      periodStart: "2026-10-05",
      platformRevenue: 200000.0,
      grossRentalValue: 2000000.0,
      refundAmount: 0.0,
      supplierPayout: 3000000.0,
    },
  ],
};

export const MOCK_INVENTORY_STATISTICS_SAMPLE: InventoryListingStatisticsResponse = {
  byEquipmentType: {
    "b1000000-0000-0000-0000-000000000001": 8,
    "b1000000-0000-0000-0000-000000000002": 4,
  },
  byBrand: {
    "c1000000-0000-0000-0000-000000000001": 8,
    "c1000000-0000-0000-0000-000000000002": 4,
  },
};

export const MOCK_SIGNALR_FINANCE_EVENT: AnalyticsDataChangedEvent = {
  eventId: "c96e288b-cab8-4d89-b225-31ef14c65873",
  version: 1,
  occurredAt: "2026-10-28T03:00:00Z",
  data: {
    scope: "Finance",
  },
};

export const MOCK_SIGNALR_RENTAL_EVENT: AnalyticsDataChangedEvent = {
  eventId: "e289bf44-789a-4122-bc5d-83b910ca8911",
  version: 1,
  occurredAt: "2026-10-28T03:05:00Z",
  data: {
    scope: "Rental",
  },
};

/**
 * Tính tổng số listing của Nhà cung cấp từ API thống kê Inventory.
 * Quy tắc: CHỈ tính tổng Object.values(byEquipmentType), KHÔNG cộng thêm byBrand để tránh đếm lặp.
 */
export function calculateTotalListings(stats: InventoryListingStatisticsResponse): number {
  return Object.values(stats.byEquipmentType || {}).reduce(
    (sum, count) => sum + count,
    0,
  );
}

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
 * Khoảng ngày mặc định 30 ngày gần nhất: [Hôm nay - 29 ngày, Hôm nay].
 */
export function getDefaultAnalyticsDateRange(): { from: string; to: string } {
  const today = getTodayDateString();
  return {
    from: offsetDate(today, -29),
    to: today,
  };
}

/**
 * Xác thực khoảng ngày theo hợp đồng mục 2:
 * - Nếu thiếu cả hai: áp dụng mặc định 30 ngày.
 * - Nếu chỉ có 1 trong 2: báo lỗi 400 INVALID_DATE_RANGE.
 * - Nếu to < from hoặc khoảng cách > 366 ngày: báo lỗi 400.
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
 * Sinh danh sách mốc thời gian (buckets) theo granularity
 */
function buildBuckets(
  from: string,
  to: string,
  granularity: AnalyticsGranularity,
): string[] {
  const buckets: string[] = [];
  const current = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);

  if (granularity === "day") {
    while (current <= end) {
      buckets.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 1);
    }
  } else if (granularity === "week") {
    // Đưa về thứ Hai đầu tuần
    const dayOfWeek = current.getUTCDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    current.setUTCDate(current.getUTCDate() + diffToMonday);

    while (current <= end) {
      buckets.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 7);
    }
  } else if (granularity === "month") {
    current.setUTCDate(1);
    while (current <= end) {
      buckets.push(current.toISOString().slice(0, 10));
      current.setUTCMonth(current.getUTCMonth() + 1);
    }
  }

  return buckets.length > 0 ? buckets : [from];
}

/**
 * Sinh dữ liệu mock linh hoạt cho Admin Overview
 */
export function generateMockAdminOverview(
  fromParam?: string | null,
  toParam?: string | null,
): AdminAnalyticsOverviewResponse {
  const { from, to } = resolveAnalyticsDateRange(fromParam, toParam);
  const diffDays = Math.max(
    1,
    Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1,
  );

  const baseRatio = Math.max(0.2, diffDays / 5);
  const totalOrders = Math.round(25 * baseRatio);
  const paidOrders = Math.round(20 * baseRatio);
  const completedOrders = Math.round(15 * baseRatio);
  const grossRentalValue = Math.round(43500000 * baseRatio);
  const platformRevenue = Math.round(grossRentalValue * 0.1);
  const completedRentalValue = Math.round(32000000 * baseRatio);
  const depositCollected = Math.round(95000000 * baseRatio);
  const deductionAmount = Math.round(500000 * baseRatio);
  const refundAmount = Math.round(1500000 * baseRatio);
  const supplierPayable = grossRentalValue - platformRevenue;
  const payoutCompleted = Math.round(36000000 * baseRatio);

  return {
    from,
    to,
    currency: "VND",
    orders: {
      totalOrders,
      paidOrders,
      activeOrders: Math.max(1, Math.round(6 * baseRatio)),
      completedOrders,
      cancelledOrders: Math.round(2 * baseRatio),
      expiredOrders: Math.round(1 * baseRatio),
      rejectedItems: Math.round(2 * baseRatio),
    },
    financial: {
      grossRentalValue,
      completedRentalValue,
      depositCollected,
      platformRevenue,
      deductionAmount,
      refundAmount,
      supplierPayable,
      payoutCompleted,
      pendingRefund: null,
    },
    rental: {
      paidItems: Math.round(28 * baseRatio),
      rentedQuantity: Math.round(42 * baseRatio),
      completedRentals: Math.round(20 * baseRatio),
    },
  };
}

/**
 * Sinh dữ liệu mock cho biểu đồ Admin Revenue & GMV.
 * Đảm bảo: Tổng các buckets BẰNG CHÍNH XÁC totalGrossRentalValue & totalPlatformRevenue.
 */
export function generateMockAdminRevenue(
  fromParam?: string | null,
  toParam?: string | null,
  granularity: AnalyticsGranularity = "day",
): AdminAnalyticsRevenueResponse {
  const { from, to } = resolveAnalyticsDateRange(fromParam, toParam);
  const bucketDates = buildBuckets(from, to, granularity);

  // Sinh các bucket ngẫu nhiên nhưng có tính xác định theo ngày
  const buckets: AnalyticsRevenueBucket[] = bucketDates.map((dateStr, index) => {
    // Sử dụng hash đơn giản từ dateStr để dữ liệu đồng nhất
    const seed = (dateStr.charCodeAt(dateStr.length - 1) + index) % 7;
    if (seed === 2) {
      // Ngày không phát sinh doanh thu (ví dụ ngày 03 trong spec mẫu)
      return {
        periodStart: dateStr,
        platformRevenue: 0,
        grossRentalValue: 0,
        refundAmount: 0,
        supplierPayout: 0,
      };
    }
    const grossRentalValue = (seed + 4) * 1_500_000;
    const platformRevenue = Math.round(grossRentalValue * 0.1);
    const refundAmount = seed === 1 ? 500_000 : seed === 4 ? 1_000_000 : 0;
    const supplierPayout = Math.round(grossRentalValue * 0.7);

    return {
      periodStart: dateStr,
      platformRevenue,
      grossRentalValue,
      refundAmount,
      supplierPayout,
    };
  });

  const totalPlatformRevenue = buckets.reduce((sum, b) => sum + b.platformRevenue, 0);
  const totalGrossRentalValue = buckets.reduce((sum, b) => sum + b.grossRentalValue, 0);
  const totalRefundAmount = buckets.reduce((sum, b) => sum + b.refundAmount, 0);
  const totalSupplierPayout = buckets.reduce((sum, b) => sum + b.supplierPayout, 0);

  return {
    from,
    to,
    granularity,
    currency: "VND",
    totalPlatformRevenue,
    totalGrossRentalValue,
    totalRefundAmount,
    totalSupplierPayout,
    buckets,
  };
}

/**
 * Sinh dữ liệu mock linh hoạt cho Supplier Overview
 */
export function generateMockSupplierOverview(
  fromParam?: string | null,
  toParam?: string | null,
): SupplierAnalyticsOverviewResponse {
  const { from, to } = resolveAnalyticsDateRange(fromParam, toParam);
  const diffDays = Math.max(
    1,
    Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1,
  );

  const baseRatio = Math.max(0.2, diffDays / 5);
  const grossRentalValue = Math.round(14500000 * baseRatio);
  const platformRevenue = Math.round(grossRentalValue * 0.1);

  return {
    from,
    to,
    currency: "VND",
    orders: {
      totalOrders: Math.round(8 * baseRatio),
      paidOrders: Math.round(6 * baseRatio),
      activeOrders: Math.max(1, Math.round(2 * baseRatio)),
      completedOrders: Math.round(5 * baseRatio),
      cancelledOrders: 0,
      expiredOrders: 0,
      rejectedItems: Math.round(1 * baseRatio),
    },
    financial: {
      grossRentalValue,
      completedRentalValue: Math.round(11000000 * baseRatio),
      depositCollected: Math.round(35000000 * baseRatio),
      platformRevenue,
      deductionAmount: Math.round(200000 * baseRatio),
      refundAmount: 0,
      supplierPayable: grossRentalValue - platformRevenue,
      payoutCompleted: Math.round(12000000 * baseRatio),
      pendingRefund: null,
    },
    rental: {
      paidItems: Math.round(8 * baseRatio),
      rentedQuantity: Math.round(14 * baseRatio),
      completedRentals: Math.round(6 * baseRatio),
    },
  };
}

/**
 * Sinh dữ liệu mock cho biểu đồ Supplier Revenue
 */
export function generateMockSupplierRevenue(
  fromParam?: string | null,
  toParam?: string | null,
  granularity: AnalyticsGranularity = "day",
): SupplierAnalyticsRevenueResponse {
  const { from, to } = resolveAnalyticsDateRange(fromParam, toParam);
  const bucketDates = buildBuckets(from, to, granularity);

  const buckets: AnalyticsRevenueBucket[] = bucketDates.map((dateStr, index) => {
    const seed = (dateStr.charCodeAt(dateStr.length - 1) + index) % 5;
    if (seed === 2) {
      return {
        periodStart: dateStr,
        platformRevenue: 0,
        grossRentalValue: 0,
        refundAmount: 0,
        supplierPayout: 0,
      };
    }
    const grossRentalValue = (seed + 2) * 1_000_000;
    const platformRevenue = Math.round(grossRentalValue * 0.1);
    const supplierPayout = Math.round(grossRentalValue * 0.8);

    return {
      periodStart: dateStr,
      platformRevenue,
      grossRentalValue,
      refundAmount: 0,
      supplierPayout,
    };
  });

  const totalPlatformRevenue = buckets.reduce((sum, b) => sum + b.platformRevenue, 0);
  const totalGrossRentalValue = buckets.reduce((sum, b) => sum + b.grossRentalValue, 0);
  const totalRefundAmount = 0;
  const totalSupplierPayout = buckets.reduce((sum, b) => sum + b.supplierPayout, 0);

  return {
    from,
    to,
    granularity,
    currency: "VND",
    totalPlatformRevenue,
    totalGrossRentalValue,
    totalRefundAmount,
    totalSupplierPayout,
    buckets,
  };
}
