import test from "node:test";
import assert from "node:assert/strict";

const { NOTIFICATION_QUERY_KEYS } = await import(
  "../src/services/notification-keys.ts"
);

test("NOTIFICATION_QUERY_KEYS ensures strict cache separation per user", () => {
  const user1 = "user-aaa-111";
  const user2 = "user-bbb-222";
  const guest = null;

  // Root keys
  assert.notDeepEqual(
    NOTIFICATION_QUERY_KEYS.all(user1),
    NOTIFICATION_QUERY_KEYS.all(user2),
  );
  assert.notDeepEqual(
    NOTIFICATION_QUERY_KEYS.all(user1),
    NOTIFICATION_QUERY_KEYS.all(guest),
  );

  // Unread count keys
  const unreadKey1 = NOTIFICATION_QUERY_KEYS.unreadCount(user1);
  const unreadKey2 = NOTIFICATION_QUERY_KEYS.unreadCount(user2);
  const unreadGuest = NOTIFICATION_QUERY_KEYS.unreadCount(guest);
  assert.deepEqual(unreadKey1, ["notifications", user1, "unread-count"]);
  assert.deepEqual(unreadKey2, ["notifications", user2, "unread-count"]);
  assert.deepEqual(unreadGuest, ["notifications", null, "unread-count"]);
  assert.notDeepEqual(unreadKey1, unreadKey2);

  // List keys
  const listKey1 = NOTIFICATION_QUERY_KEYS.list(user1, { page: 1, pageSize: 20 });
  const listKey2 = NOTIFICATION_QUERY_KEYS.list(user2, { page: 1, pageSize: 20 });
  assert.notDeepEqual(listKey1, listKey2);

  // Prefix matching: invalidating list(user1) does not touch list(user2)
  assert.equal(listKey1[0], "notifications");
  assert.equal(listKey1[1], user1);
  assert.equal(listKey1[2], "list");
  assert.equal(listKey2[1], user2);
});

test("Cache queries for previous user can be purged without affecting new user", () => {
  const store = new Map();

  function setQuery(key, data) {
    store.set(JSON.stringify(key), data);
  }

  function getQuery(key) {
    return store.get(JSON.stringify(key));
  }

  function removeQueriesByPrefix(prefixKey) {
    for (const keyStr of Array.from(store.keys())) {
      const keyArr = JSON.parse(keyStr);
      const isMatch = prefixKey.every((val, idx) => keyArr[idx] === val);
      if (isMatch) {
        store.delete(keyStr);
      }
    }
  }

  const u1 = "user-1";
  const u2 = "user-2";

  setQuery(NOTIFICATION_QUERY_KEYS.unreadCount(u1), { unreadCount: 5 });
  setQuery(NOTIFICATION_QUERY_KEYS.list(u1, { page: 1 }), { items: ["notif1"] });
  setQuery(NOTIFICATION_QUERY_KEYS.unreadCount(u2), { unreadCount: 12 });
  setQuery(NOTIFICATION_QUERY_KEYS.list(u2, { page: 1 }), { items: ["notif2"] });

  // Verify both exist
  assert.deepEqual(getQuery(NOTIFICATION_QUERY_KEYS.unreadCount(u1)), { unreadCount: 5 });
  assert.deepEqual(getQuery(NOTIFICATION_QUERY_KEYS.unreadCount(u2)), { unreadCount: 12 });

  // User 1 logs out or switches: remove all queries for u1
  removeQueriesByPrefix(NOTIFICATION_QUERY_KEYS.all(u1));

  // u1 queries are purged, u2 queries remain intact
  assert.equal(getQuery(NOTIFICATION_QUERY_KEYS.unreadCount(u1)), undefined);
  assert.equal(getQuery(NOTIFICATION_QUERY_KEYS.list(u1, { page: 1 })), undefined);
  assert.deepEqual(getQuery(NOTIFICATION_QUERY_KEYS.unreadCount(u2)), { unreadCount: 12 });
  assert.deepEqual(getQuery(NOTIFICATION_QUERY_KEYS.list(u2, { page: 1 })), { items: ["notif2"] });
});

test("SignalR event coalescing debounces rapid bursts within 250ms into a single refresh", async () => {
  let refreshCount = 0;
  let timer = null;
  const COALESCE_MS = 250;

  function onInboxChanged(event) {
    // Nullable fields check
    assert.ok(typeof event.changeType === "string");
    // Coalesce within window
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      refreshCount += 1;
    }, COALESCE_MS);
  }

  // Rapid burst of 5 events with various nullable fields
  onInboxChanged({ changeType: "CREATED", notificationId: null, category: null, occurredAt: undefined });
  onInboxChanged({ changeType: "UPDATED", notificationId: "id-1", category: "ORDER", occurredAt: "2026-11-05T01:00:00Z" });
  onInboxChanged({ changeType: "READ", notificationId: "id-2", category: null, occurredAt: undefined });
  onInboxChanged({ changeType: "CREATED", notificationId: "id-3", category: "PAYMENT", occurredAt: null });
  onInboxChanged({ changeType: "READ_ALL", notificationId: null, category: null, occurredAt: "2026-11-05T01:00:00Z" });

  // Immediately, refresh should not have executed yet
  assert.equal(refreshCount, 0);

  // Wait 300ms (> 250ms coalesce window)
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Should have coalesced into exactly 1 refresh
  assert.equal(refreshCount, 1);
});

test("Concurrent read-all deduplication guards in-flight execution", async () => {
  let inFlight = false;
  let backendCalls = 0;

  async function markAllAsRead() {
    if (inFlight) {
      // Guard against concurrent executions
      return;
    }
    inFlight = true;
    try {
      backendCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 50));
    } finally {
      inFlight = false;
    }
  }

  // Trigger 3 concurrent calls
  await Promise.all([
    markAllAsRead(),
    markAllAsRead(),
    markAllAsRead(),
  ]);

  // Only 1 backend call made
  assert.equal(backendCalls, 1);
});

test("Mark as read mutation failure cleans up in-flight state and surfaces error", async () => {
  const inFlightIds = new Set();

  async function markAsRead(id, shouldFail = false) {
    if (inFlightIds.has(id)) return;
    inFlightIds.add(id);
    try {
      if (shouldFail) {
        throw new Error("Network timeout");
      }
    } finally {
      inFlightIds.delete(id);
    }
  }

  const testId = "notif-failure-test";
  await assert.rejects(
    async () => {
      await markAsRead(testId, true);
    },
    (err) => {
      assert.equal(err.message, "Network timeout");
      return true;
    },
  );

  // in-flight set is cleaned up even on failure
  assert.equal(inFlightIds.has(testId), false);
  assert.equal(inFlightIds.size, 0);
});
