import test from "node:test";
import assert from "node:assert/strict";
import { HttpError, HttpTransportType } from "@microsoft/signalr";

const {
  SIGNALR_DEFAULT_TRANSPORT,
  SIGNALR_RECONNECT_DELAYS_MS,
  SignalRHttpClient,
  createSignalRConnection,
} = await import("../src/services/signalr-client.ts");

const {
  createNotificationHubConnection,
  NOTIFICATION_INBOX_CHANGED_EVENT,
} = await import("../src/services/notification-hub.ts");

test("SIGNALR_DEFAULT_TRANSPORT combines WebSockets and LongPolling", () => {
  const expected =
    HttpTransportType.WebSockets | HttpTransportType.LongPolling;
  assert.equal(SIGNALR_DEFAULT_TRANSPORT, expected);
  assert.equal(
    (SIGNALR_DEFAULT_TRANSPORT & HttpTransportType.WebSockets) !== 0,
    true,
  );
  assert.equal(
    (SIGNALR_DEFAULT_TRANSPORT & HttpTransportType.LongPolling) !== 0,
    true,
  );
});

test("SIGNALR_RECONNECT_DELAYS_MS matches standard backoff", () => {
  assert.deepEqual(SIGNALR_RECONNECT_DELAYS_MS, [0, 2_000, 10_000, 30_000]);
});

test("createSignalRConnection sets correct transport and withCredentials", () => {
  const hubUrl = "http://localhost:3000/api/v1/notifications/hubs/inbox";
  const connection = createSignalRConnection(hubUrl);

  assert.equal(connection.baseUrl, hubUrl);
  // Inspect underlying HttpConnection options
  const httpConn = connection.connection;
  assert.ok(httpConn);
  assert.equal(
    httpConn._options.transport,
    HttpTransportType.WebSockets | HttpTransportType.LongPolling,
  );
  assert.equal(httpConn._options.withCredentials, true);

  // Assert no access_token in URL query param / factory is undefined (HttpOnly cookie used)
  assert.equal(httpConn._httpClient._accessTokenFactory, undefined);
  assert.equal(hubUrl.includes("access_token"), false);
});

test("createNotificationHubConnection delegates to createSignalRConnection", () => {
  const hubUrl = "http://localhost:3000/api/v1/notifications/hubs/inbox";
  const connection = createNotificationHubConnection(hubUrl);

  assert.equal(connection.baseUrl, hubUrl);
  const httpConn = connection.connection;
  assert.equal(
    httpConn._options.transport,
    HttpTransportType.WebSockets | HttpTransportType.LongPolling,
  );
  assert.equal(httpConn._options.withCredentials, true);
  assert.equal(NOTIFICATION_INBOX_CHANGED_EVENT, "NotificationInboxChanged");
});

test("SignalRHttpClient calls refreshSession on 401 then retries", async () => {
  let refreshed = false;
  let unauthorizedCalled = false;
  let forbiddenCalled = false;
  let attempts = 0;

  const client = new SignalRHttpClient({
    refreshSession: async () => {
      refreshed = true;
    },
    onUnauthorized: () => {
      unauthorizedCalled = true;
    },
    onForbidden: () => {
      forbiddenCalled = true;
    },
  });

  // Mock internal send
  client._httpClient = {
    send: async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new HttpError("Unauthorized", 401);
      }
      return { statusCode: 200, statusText: "OK", content: "ok" };
    },
  };

  const response = await client.send({ url: "http://localhost/negotiate", method: "GET" });
  assert.equal(response.statusCode, 200);
  assert.equal(attempts, 2);
  assert.equal(refreshed, true);
  assert.equal(unauthorizedCalled, false);
  assert.equal(forbiddenCalled, false);
});

test("SignalRHttpClient calls onUnauthorized when refreshSession fails with 401", async () => {
  let unauthorizedCalled = false;

  const client = new SignalRHttpClient({
    refreshSession: async () => {
      const err = new Error("Session expired");
      err.status = 401;
      throw err;
    },
    onUnauthorized: () => {
      unauthorizedCalled = true;
    },
  });

  client._httpClient = {
    send: async () => {
      throw new HttpError("Unauthorized", 401);
    },
  };

  await assert.rejects(
    async () => {
      await client.send({ url: "http://localhost/negotiate", method: "GET" });
    },
    (err) => {
      assert.equal(err.message, "Session expired");
      return true;
    },
  );

  assert.equal(unauthorizedCalled, true);
});

test("SignalRHttpClient calls onForbidden on 403 response", async () => {
  let forbiddenCalled = false;

  const client = new SignalRHttpClient({
    onForbidden: () => {
      forbiddenCalled = true;
    },
  });

  client._httpClient = {
    send: async () => {
      throw new HttpError("Forbidden", 403);
    },
  };

  await assert.rejects(
    async () => {
      await client.send({ url: "http://localhost/negotiate", method: "GET" });
    },
    (err) => {
      assert.equal(err instanceof HttpError, true);
      assert.equal(err.statusCode, 403);
      return true;
    },
  );

  assert.equal(forbiddenCalled, true);
});
