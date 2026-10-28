import test from "node:test";
import assert from "node:assert/strict";

const {
  calculateTotalListings,
  getDefaultAnalyticsDateRange,
  generateMockAdminOverview,
  generateMockAdminRevenue,
  generateMockSupplierOverview,
  generateMockSupplierRevenue,
  resolveAnalyticsDateRange,
  MOCK_INVENTORY_STATISTICS_SAMPLE,
} = await import("../src/mocks/analytics/dashboard-mock-data.ts");

test("getDefaultAnalyticsDateRange returns 30 days window [today - 29 days, today]", () => {
  const range = getDefaultAnalyticsDateRange();
  assert.ok(range.from);
  assert.ok(range.to);
  assert.ok(range.to >= range.from);

  const start = Date.parse(`${range.from}T00:00:00Z`);
  const end = Date.parse(`${range.to}T00:00:00Z`);
  const days = Math.round((end - start) / 86_400_000) + 1;
  assert.equal(days, 30);
});

test("resolveAnalyticsDateRange validates contract rules", () => {
  // Missing both -> default 30 days
  const defaultRange = resolveAnalyticsDateRange();
  assert.ok(defaultRange.from && defaultRange.to);

  // Missing one -> throws INVALID_DATE_RANGE
  assert.throws(
    () => resolveAnalyticsDateRange("2026-10-01", null),
    /INVALID_DATE_RANGE/,
  );
  assert.throws(
    () => resolveAnalyticsDateRange(null, "2026-10-05"),
    /INVALID_DATE_RANGE/,
  );

  // to < from -> throws INVALID_DATE_RANGE
  assert.throws(
    () => resolveAnalyticsDateRange("2026-10-10", "2026-10-05"),
    /INVALID_DATE_RANGE/,
  );

  // > 366 days -> throws INVALID_DATE_RANGE
  assert.throws(
    () => resolveAnalyticsDateRange("2025-01-01", "2026-02-15"),
    /INVALID_DATE_RANGE/,
  );

  // Valid range passes
  const valid = resolveAnalyticsDateRange("2026-10-01", "2026-10-05");
  assert.equal(valid.from, "2026-10-01");
  assert.equal(valid.to, "2026-10-05");
});

test("generateMockAdminOverview returns 4 core KPI cards matching spec", () => {
  const overview = generateMockAdminOverview("2026-10-01", "2026-10-05");

  assert.equal(overview.from, "2026-10-01");
  assert.equal(overview.to, "2026-10-05");
  assert.equal(overview.currency, "VND");

  // 4 cards in Section 3.1
  assert.ok(Number.isFinite(overview.orders.totalOrders));
  assert.ok(Number.isFinite(overview.orders.paidOrders));
  assert.ok(Number.isFinite(overview.financial.grossRentalValue));
  assert.ok(Number.isFinite(overview.financial.platformRevenue));

  // Orders hierarchy invariant
  assert.ok(overview.orders.totalOrders >= overview.orders.paidOrders);
});

test("generateMockAdminRevenue enforces exact bucket sum contract", () => {
  const revenue = generateMockAdminRevenue("2026-10-01", "2026-10-05", "day");

  assert.equal(revenue.granularity, "day");
  assert.equal(revenue.currency, "VND");
  assert.ok(revenue.buckets.length > 0);

  // Contract invariant in Section 3.2: sum of buckets MUST equal totals
  const sumPlatformRevenue = revenue.buckets.reduce(
    (sum, b) => sum + b.platformRevenue,
    0,
  );
  const sumGrossRentalValue = revenue.buckets.reduce(
    (sum, b) => sum + b.grossRentalValue,
    0,
  );
  const sumRefundAmount = revenue.buckets.reduce(
    (sum, b) => sum + b.refundAmount,
    0,
  );
  const sumSupplierPayout = revenue.buckets.reduce(
    (sum, b) => sum + b.supplierPayout,
    0,
  );

  assert.equal(revenue.totalPlatformRevenue, sumPlatformRevenue);
  assert.equal(revenue.totalGrossRentalValue, sumGrossRentalValue);
  assert.equal(revenue.totalRefundAmount, sumRefundAmount);
  assert.equal(revenue.totalSupplierPayout, sumSupplierPayout);
});

test("calculateTotalListings strictly avoids double counting byBrand", () => {
  const total = calculateTotalListings(MOCK_INVENTORY_STATISTICS_SAMPLE);
  assert.equal(total, 12);
});
