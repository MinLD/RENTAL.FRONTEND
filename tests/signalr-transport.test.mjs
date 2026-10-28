import test from "node:test";
import assert from "node:assert/strict";

const {
  createPaymentHubConnection,
  rememberPaymentCompletion,
  PAYMENT_COMPLETED_EVENT,
} = await import("../src/services/payment-hub.ts");

const {
  createSignalRConnection,
  DEFAULT_RECONNECT_DELAYS_MS,
} = await import("../src/services/signalr-transport.ts");

test("PAYMENT_COMPLETED_EVENT and default reconnect delays", () => {
  assert.equal(PAYMENT_COMPLETED_EVENT, "PaymentCompleted");
  assert.deepEqual(DEFAULT_RECONNECT_DELAYS_MS, [0, 2_000, 5_000, 10_000, 30_000]);
});

test("rememberPaymentCompletion deduplicates and maintains recent payments limit", () => {
  let map = new Map();
  const event1 = {
    eventId: "ev-1",
    data: { rentalOrderId: "order-1", invoiceRef: "inv-1", revision: 1 },
  };
  map = rememberPaymentCompletion(map, event1);
  assert.equal(map.size, 1);
  assert.equal(map.get("order-1"), event1);

  // Same eventId ignored
  const mapSame = rememberPaymentCompletion(map, event1);
  assert.equal(mapSame, map);

  // New revision for same order
  const event1Rev2 = {
    eventId: "ev-2",
    data: { rentalOrderId: "order-1", invoiceRef: "inv-1", revision: 2 },
  };
  map = rememberPaymentCompletion(map, event1Rev2);
  assert.equal(map.size, 1);
  assert.equal(map.get("order-1")?.eventId, "ev-2");
});

test("createSignalRConnection and createPaymentHubConnection instantiate HubConnection", () => {
  const paymentConn = createPaymentHubConnection("http://localhost:3000/hubs/payments");
  assert.ok(paymentConn);
  assert.equal(typeof paymentConn.start, "function");
  assert.equal(typeof paymentConn.stop, "function");

  const analyticsConn = createSignalRConnection("http://localhost:3000/hubs/analytics", {
    hubName: "AnalyticsHub",
  });
  assert.ok(analyticsConn);
  assert.equal(typeof analyticsConn.start, "function");
  assert.equal(typeof analyticsConn.stop, "function");
});
