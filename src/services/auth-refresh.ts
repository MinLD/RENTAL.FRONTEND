import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  getAuthCookieValues,
  getSetCookieHeaders,
} from "@/services/auth-cookie";
import { logAuthFailure } from "@/services/auth-diagnostics";
import { buildBackendApiUrl } from "@/services/backend-api";

export const AUTH_REFRESH_ENDPOINT = API_ENDPOINTS.backend.auth.refresh;

type RefreshSnapshot = {
  body: ArrayBuffer;
  headers: [string, string][];
  setCookieHeaders: string[];
  status: number;
  statusText: string;
};

type RefreshSession = {
  promise: Promise<RefreshSnapshot>;
  expiresAt: number;
};
// Late requests can still carry the previous cookie after a successful rotation.
// Share their result briefly, including across bundles in the same Node process.
const refreshState = globalThis as typeof globalThis & {
  __dprentalRefreshSessions?: Map<string, RefreshSession>;
};
const refreshSessions = (refreshState.__dprentalRefreshSessions ??= new Map());
const REFRESH_RESULT_GRACE_MS = 5_000;
const MAX_CACHED_REFRESH_SESSIONS = 256;

export function isAuthRefreshEndpoint(endpoint: string) {
  return endpoint.replace(/\/+$/, "") === AUTH_REFRESH_ENDPOINT;
}

function getCookieValue(cookieHeader: string | null, cookieName: string) {
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");

    if (rawName === cookieName) {
      return rawValueParts.join("=") || null;
    }
  }

  return null;
}

async function hashSessionKey(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createSnapshotResponse(snapshot: RefreshSnapshot) {
  const headers = new Headers(snapshot.headers);

  for (const setCookieHeader of snapshot.setCookieHeaders) {
    headers.append("set-cookie", setCookieHeader);
  }

  return new Response(
    [204, 205, 304].includes(snapshot.status) ? null : snapshot.body.slice(0),
    {
      headers,
      status: snapshot.status,
      statusText: snapshot.statusText,
    },
  );
}

async function refreshBackendSessionSnapshot(cookieHeader: string | null) {
  const response = await fetch(buildBackendApiUrl(AUTH_REFRESH_ENDPOINT), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    method: "POST",
  });
  const setCookieHeaders = getSetCookieHeaders(response.headers);

  if (!response.ok) await logAuthFailure("refresh", response);

  return {
    body: await response.arrayBuffer(),
    headers: Array.from(response.headers.entries()).filter(
      ([name]) => name.toLowerCase() !== "set-cookie",
    ),
    setCookieHeaders,
    status: response.status,
    statusText: response.statusText,
  };
}

export async function refreshBackendSession(cookieHeader: string | null) {
  const refreshToken = getCookieValue(cookieHeader, "refreshToken");

  if (!refreshToken) {
    return createSnapshotResponse(
      await refreshBackendSessionSnapshot(cookieHeader),
    );
  }

  const sessionKey = await hashSessionKey(refreshToken);
  const now = Date.now();
  for (const [key, session] of refreshSessions) {
    if (session.expiresAt <= now) refreshSessions.delete(key);
  }
  const existingRefreshSession = refreshSessions.get(sessionKey);

  if (existingRefreshSession) {
    return createSnapshotResponse(await existingRefreshSession.promise);
  }

  const session: RefreshSession = {
    promise: refreshBackendSessionSnapshot(cookieHeader),
    expiresAt: Number.POSITIVE_INFINITY,
  };
  refreshSessions.set(sessionKey, session);

  try {
    const snapshot = await session.promise;
    const response = createSnapshotResponse(snapshot);
    if (response.ok && getAuthCookieValues(response.headers).accessToken) {
      session.expiresAt = Date.now() + REFRESH_RESULT_GRACE_MS;
      if (refreshSessions.size > MAX_CACHED_REFRESH_SESSIONS) {
        for (const [key, entry] of refreshSessions) {
          if (key !== sessionKey && Number.isFinite(entry.expiresAt)) {
            refreshSessions.delete(key);
            if (refreshSessions.size <= MAX_CACHED_REFRESH_SESSIONS) break;
          }
        }
      }
    } else {
      refreshSessions.delete(sessionKey);
    }
    return response;
  } catch (error) {
    refreshSessions.delete(sessionKey);
    throw error;
  }
}
