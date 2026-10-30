import test from "node:test";
import assert from "node:assert/strict";

const {
  calculateTotalListings,
  getDateRangeForPreset,
  getDefaultAnalyticsDateRange,
  offsetDate,
  resolveActiveDatePreset,
  resolveAnalyticsDateRange,
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

test("getDateRangeForPreset calculates expected bounds", () => {
  const today = "2026-10-30";
  assert.deepEqual(getDateRangeForPreset("7d", today), {
    from: "2026-10-24",
    to: "2026-10-30",
  });
  assert.deepEqual(getDateRangeForPreset("30d", today), {
    from: "2026-10-01",
    to: "2026-10-30",
  });
  assert.deepEqual(getDateRangeForPreset("this-month", today), {
    from: "2026-10-01",
    to: "2026-10-30",
  });
});

test("resolveActiveDatePreset resolves mutual exclusivity on 30th of month (prevents double highlight)", () => {
  const today = "2026-10-30";
  const from = "2026-10-01";
  const to = "2026-10-30";

  assert.equal(
    resolveActiveDatePreset({ from, to, today }),
    "30d",
  );

  assert.equal(
    resolveActiveDatePreset({ from, to, today, selectedPreset: "this-month" }),
    "this-month",
  );

  assert.equal(
    resolveActiveDatePreset({ from, to, today, selectedPreset: "30d" }),
    "30d",
  );

  assert.equal(
    resolveActiveDatePreset({ from, to, today, selectedPreset: "custom" }),
    "custom",
  );
});

test("resolveActiveDatePreset resolves mutual exclusivity on 7th of month (7d vs this-month)", () => {
  const today = "2026-10-07";
  const from = "2026-10-01";
  const to = "2026-10-07";

  assert.equal(
    resolveActiveDatePreset({ from, to, today, selectedPreset: "7d" }),
    "7d",
  );

  assert.equal(
    resolveActiveDatePreset({ from, to, today, selectedPreset: "this-month" }),
    "this-month",
  );
});

test("resolveActiveDatePreset handles arbitrary custom date ranges", () => {
  const today = "2026-10-30";
  assert.equal(
    resolveActiveDatePreset({
      from: "2026-10-05",
      to: "2026-10-20",
      today,
    }),
    "custom",
  );
});
