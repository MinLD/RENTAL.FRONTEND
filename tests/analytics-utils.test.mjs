import test from "node:test";
import assert from "node:assert/strict";

const {
  calculateTotalListings,
  getDefaultAnalyticsDateRange,
  isValidDateString,
  offsetDate,
  resolveAnalyticsDateRange,
  validateAnalyticsDateRange,
  analyticsQueryKeys,
} = await import("../src/utils/analytics.ts");

const { API_ENDPOINTS } = await import("../src/config/api-endpoints.ts");

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

test("offsetDate calculates correct dates", () => {
  assert.equal(offsetDate("2026-10-01", 5), "2026-10-06");
  assert.equal(offsetDate("2026-10-01", -5), "2026-09-26");
});

test("resolveAnalyticsDateRange validates contract rules", () => {
  const defaultRange = resolveAnalyticsDateRange();
  assert.ok(defaultRange.from && defaultRange.to);

  assert.throws(
    () => resolveAnalyticsDateRange("2026-10-01", null),
    /INVALID_DATE_RANGE/,
  );
  assert.throws(
    () => resolveAnalyticsDateRange(null, "2026-10-05"),
    /INVALID_DATE_RANGE/,
  );

  assert.throws(
    () => resolveAnalyticsDateRange("2026-10-10", "2026-10-05"),
    /INVALID_DATE_RANGE/,
  );

  assert.throws(
    () => resolveAnalyticsDateRange("2025-01-01", "2026-02-15"),
    /INVALID_DATE_RANGE/,
  );

  const valid = resolveAnalyticsDateRange("2026-10-01", "2026-10-05");
  assert.equal(valid.from, "2026-10-01");
  assert.equal(valid.to, "2026-10-05");
});

test("isValidDateString correctly handles calendar valid and invalid dates including leap years", () => {
  assert.equal(isValidDateString("2024-02-29"), true); // 2024 is a leap year
  assert.equal(isValidDateString("2026-02-29"), false); // 2026 is not a leap year
  assert.equal(isValidDateString("2026-02-28"), true);
  assert.equal(isValidDateString("2026-04-31"), false); // April has 30 days
  assert.equal(isValidDateString("2026-13-01"), false); // Month 13
  assert.equal(isValidDateString("invalid-date"), false);
});

test("validateAnalyticsDateRange tests 366 boundary", () => {
  // 366 days inclusive in a leap year: 2024-01-01 to 2024-12-31 is 366 days
  const res366 = validateAnalyticsDateRange("2024-01-01", "2024-12-31");
  assert.equal(res366.valid, true);

  // 367 days inclusive: 2024-01-01 to 2025-01-01 is 367 days
  const res367 = validateAnalyticsDateRange("2024-01-01", "2025-01-01");
  assert.equal(res367.valid, false);
  assert.match(res367.error, /366 ngày/);
});

test("analyticsQueryKeys builds isolated query keys with user ID", () => {
  const keyAdmin = analyticsQueryKeys.adminOverview("user-1", "2026-10-01", "2026-10-30");
  assert.deepEqual(keyAdmin, ["analytics", "admin", "user-1", "overview", "2026-10-01", "2026-10-30"]);

  const keySupplier = analyticsQueryKeys.supplierOverview("user-2", "2026-10-01", "2026-10-30");
  assert.deepEqual(keySupplier, ["analytics", "supplier", "user-2", "overview", "2026-10-01", "2026-10-30"]);

  const keyStats = analyticsQueryKeys.supplierListingStats("user-2");
  assert.deepEqual(keyStats, ["analytics", "supplier", "user-2", "inventory-stats"]);
});

test("calculateTotalListings strictly avoids double counting byBrand", () => {
  const stats = {
    byEquipmentType: {
      "b1000000-0000-0000-0000-000000000001": 8,
      "b1000000-0000-0000-0000-000000000002": 4,
    },
    byBrand: {
      "c1000000-0000-0000-0000-000000000001": 8,
      "c1000000-0000-0000-0000-000000000002": 4,
    },
  };
  const total = calculateTotalListings(stats);
  assert.equal(total, 12);
});

test("API_ENDPOINTS.backend.analytics generates correct real backend URLs", () => {
  const analytics = API_ENDPOINTS.backend.analytics;

  assert.equal(analytics.overview(), "/api/v1/analytics/overview");
  assert.equal(
    analytics.overview({ from: "2026-10-01", to: "2026-10-05" }),
    "/api/v1/analytics/overview?from=2026-10-01&to=2026-10-05",
  );

  assert.equal(
    analytics.revenue({ from: "2026-10-01", to: "2026-10-05", granularity: "day" }),
    "/api/v1/analytics/revenue?from=2026-10-01&to=2026-10-05&granularity=day",
  );

  assert.equal(
    analytics.orders({ from: "2026-10-01", to: "2026-10-05" }),
    "/api/v1/analytics/orders?from=2026-10-01&to=2026-10-05",
  );

  assert.equal(
    analytics.equipment({ from: "2026-10-01", to: "2026-10-05", limit: 5 }),
    "/api/v1/analytics/equipment?from=2026-10-01&to=2026-10-05&limit=5",
  );

  assert.equal(
    analytics.suppliers({ from: "2026-10-01", to: "2026-10-05", page: 1, pageSize: 20 }),
    "/api/v1/analytics/suppliers?from=2026-10-01&to=2026-10-05&page=1&pageSize=20",
  );

  assert.equal(
    analytics.meOverview({ from: "2026-10-01", to: "2026-10-05" }),
    "/api/v1/analytics/me/overview?from=2026-10-01&to=2026-10-05",
  );

  assert.equal(
    analytics.meRevenue({ from: "2026-10-01", to: "2026-10-05", granularity: "week" }),
    "/api/v1/analytics/me/revenue?from=2026-10-01&to=2026-10-05&granularity=week",
  );

  assert.equal(
    API_ENDPOINTS.backend.inventory.statistics,
    "/api/v1/inventory/equipment-listings/statistics",
  );
});
