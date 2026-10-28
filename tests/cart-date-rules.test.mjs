import test from "node:test";
import assert from "node:assert/strict";

const { addDays, maxStartDate, validateCartItem } = await import(
  "../src/utils/cart.ts"
);

test("addDays calculates correct dates across months", () => {
  assert.equal(addDays("2026-10-28", 3), "2026-10-31");
  assert.equal(addDays("2026-10-30", 3), "2026-11-02");
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
});

test("validateCartItem enforces minimum 3-day lead time for transport", () => {
  const today = "2026-10-28";
  const minStart = addDays(today, 3); // 2026-10-31

  // Today (2026-10-28) -> should fail
  assert.notEqual(
    validateCartItem(
      {
        equipmentListingId: "eq-1",
        quantity: 1,
        expectedStartDate: today,
        expectedEndDate: "2026-11-05",
      },
      today,
    ),
    null,
  );

  // Day 1 (2026-10-29) -> should fail
  assert.notEqual(
    validateCartItem(
      {
        equipmentListingId: "eq-1",
        quantity: 1,
        expectedStartDate: "2026-10-29",
        expectedEndDate: "2026-11-05",
      },
      today,
    ),
    null,
  );

  // Day 2 (2026-10-30) -> should fail
  assert.notEqual(
    validateCartItem(
      {
        equipmentListingId: "eq-1",
        quantity: 1,
        expectedStartDate: "2026-10-30",
        expectedEndDate: "2026-11-05",
      },
      today,
    ),
    null,
  );

  // Day 3 / Starting on 4th day (2026-10-31) -> exactly minStart -> should pass
  assert.equal(
    validateCartItem(
      {
        equipmentListingId: "eq-1",
        quantity: 1,
        expectedStartDate: minStart,
        expectedEndDate: "2026-11-05",
      },
      today,
    ),
    null,
  );

  // Later date (2026-11-10) -> should pass
  assert.equal(
    validateCartItem(
      {
        equipmentListingId: "eq-1",
        quantity: 1,
        expectedStartDate: "2026-11-10",
        expectedEndDate: "2026-11-15",
      },
      today,
    ),
    null,
  );
});

test("validateCartItem rejects invalid ranges or dates exceeding 6 months", () => {
  const today = "2026-10-28";

  // End date before start date
  assert.notEqual(
    validateCartItem(
      {
        equipmentListingId: "eq-1",
        quantity: 1,
        expectedStartDate: "2026-11-05",
        expectedEndDate: "2026-11-01",
      },
      today,
    ),
    null,
  );

  // Start date > 6 months
  assert.notEqual(
    validateCartItem(
      {
        equipmentListingId: "eq-1",
        quantity: 1,
        expectedStartDate: "2027-06-01",
        expectedEndDate: "2027-06-10",
      },
      today,
    ),
    null,
  );
});
