import test from "node:test";
import assert from "node:assert/strict";

const { API_ENDPOINTS } = await import("../src/config/api-endpoints.ts");

test("notifications.list generates clean URLs with query parameters", () => {
  const { list } = API_ENDPOINTS.backend.notifications;

  // No parameters
  assert.equal(list(), "/api/v1/notifications");
  assert.equal(list({}), "/api/v1/notifications");

  // Pagination parameters
  assert.equal(
    list({ page: 1, pageSize: 20 }),
    "/api/v1/notifications?page=1&pageSize=20",
  );
  assert.equal(
    list({ page: 2, pageSize: 10 }),
    "/api/v1/notifications?page=2&pageSize=10",
  );

  // Status and category filters
  assert.equal(
    list({ status: "unread" }),
    "/api/v1/notifications?status=unread",
  );
  assert.equal(
    list({ category: "ORDER" }),
    "/api/v1/notifications?category=ORDER",
  );

  // Combined filters
  const fullUrl = list({
    page: 1,
    pageSize: 10,
    status: "unread",
    category: "PAYMENT",
  });
  const parsed = new URL(`http://localhost${fullUrl}`);
  assert.equal(parsed.pathname, "/api/v1/notifications");
  assert.equal(parsed.searchParams.get("page"), "1");
  assert.equal(parsed.searchParams.get("pageSize"), "10");
  assert.equal(parsed.searchParams.get("status"), "unread");
  assert.equal(parsed.searchParams.get("category"), "PAYMENT");

  // Undefined and empty string values are omitted
  assert.equal(
    list({ page: undefined, status: "", category: undefined }),
    "/api/v1/notifications",
  );
});

test("notifications.unreadCount returns correct endpoint path", () => {
  assert.equal(
    API_ENDPOINTS.backend.notifications.unreadCount,
    "/api/v1/notifications/unread-count",
  );
});

test("notifications.markAsRead builds URL with encoded id", () => {
  const { markAsRead } = API_ENDPOINTS.backend.notifications;
  const testGuid = "123e4567-e89b-12d3-a456-426614174000";
  assert.equal(
    markAsRead(testGuid),
    `/api/v1/notifications/${testGuid}/read`,
  );

  // Special characters are encoded
  assert.equal(
    markAsRead("abc/def"),
    "/api/v1/notifications/abc%2Fdef/read",
  );
});

test("notifications.markAllAsRead returns correct endpoint path", () => {
  assert.equal(
    API_ENDPOINTS.backend.notifications.markAllAsRead,
    "/api/v1/notifications/read-all",
  );
});
