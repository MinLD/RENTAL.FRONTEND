import test from "node:test";
import assert from "node:assert/strict";

const { ApiError } = await import("../src/services/api-error.ts");
const {
  getNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} = await import("../src/services/notification-service.ts");

test("markNotificationAsRead succeeds on 200 response with empty body", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  let requestedMethod = "";

  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "GET";
    return new Response(null, {
      status: 200,
      statusText: "OK",
      headers: { "Content-Type": "text/plain" },
    });
  };

  try {
    const notificationId = "123e4567-e89b-12d3-a456-426614174000";
    await markNotificationAsRead(notificationId);
    assert.equal(requestedMethod, "PATCH");
    assert.equal(
      requestedUrl.endsWith(`/api/v1/notifications/${notificationId}/read`),
      true,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("markNotificationAsRead throws ApiError on 404 ProblemDetails", async () => {
  const originalFetch = globalThis.fetch;

  const problemDetails = {
    type: "https://tools.ietf.org/html/rfc7231#section-6.5.4",
    title: "NotFound",
    status: 404,
    detail: "Thông báo không tồn tại trong hệ thống.",
  };

  globalThis.fetch = async () => {
    return new Response(JSON.stringify(problemDetails), {
      status: 404,
      statusText: "Not Found",
      headers: { "Content-Type": "application/problem+json" },
    });
  };

  try {
    await assert.rejects(
      async () => {
        await markNotificationAsRead("missing-id");
      },
      (err) => {
        assert.equal(err instanceof ApiError, true);
        assert.equal(err.status, 404);
        assert.equal(err.message, "Thông báo không tồn tại trong hệ thống.");
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("markNotificationAsRead throws ApiError on 401 ProblemDetails", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        title: "Unauthorized",
        status: 401,
        detail: "Người dùng chưa xác thực.",
      }),
      {
        status: 401,
        statusText: "Unauthorized",
        headers: { "Content-Type": "application/problem+json" },
      },
    );
  };

  try {
    await assert.rejects(
      async () => {
        await markNotificationAsRead("any-id");
      },
      (err) => {
        assert.equal(err instanceof ApiError, true);
        assert.equal(err.status, 401);
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("markAllNotificationsAsRead sends PATCH without body and returns response", async () => {
  const originalFetch = globalThis.fetch;
  let sentBody = null;
  let sentMethod = "";

  const expectedResponse = {
    markedCount: 8,
    cutoffUtc: "2026-11-05T01:30:00Z",
    readAt: "2026-11-05T01:30:00Z",
  };

  globalThis.fetch = async (url, init) => {
    sentMethod = init?.method ?? "GET";
    sentBody = init?.body ?? null;
    return new Response(JSON.stringify(expectedResponse), {
      status: 200,
      statusText: "OK",
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await markAllNotificationsAsRead();
    assert.equal(sentMethod, "PATCH");
    assert.equal(sentBody, null); // No cutoff body sent from FE
    assert.deepEqual(result, expectedResponse);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getUnreadCount parses response object", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(JSON.stringify({ unreadCount: 15 }), {
      status: 200,
      statusText: "OK",
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await getUnreadCount();
    assert.deepEqual(result, { unreadCount: 15 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getNotifications parses paginated response", async () => {
  const originalFetch = globalThis.fetch;

  const mockData = {
    items: [
      {
        id: "1",
        notificationType: "ORDER_CREATED",
        category: "ORDER",
        severity: "INFO",
        title: "Đơn hàng mới",
        body: "Đơn hàng đã được tạo.",
        resourceType: "Order",
        resourceId: "ord-123",
        isActionable: true,
        actionUrl: "/orders/ord-123",
        isRead: false,
        readAt: null,
        occurredAt: "2026-11-05T02:00:00Z",
        createdAt: "2026-11-05T02:00:00Z",
      },
    ],
    page: 1,
    pageSize: 20,
    totalCount: 1,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };

  globalThis.fetch = async () => {
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await getNotifications({ page: 1, pageSize: 20 });
    assert.deepEqual(result, mockData);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
