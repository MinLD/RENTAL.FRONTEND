import { API_ENDPOINTS } from "@/config/api-endpoints";
import { getSetCookieHeaders } from "@/services/auth-cookie";
import { buildBackendApiUrl } from "@/services/backend-api";

export const AUTH_REFRESH_ENDPOINT = API_ENDPOINTS.backend.auth.refresh;

type RefreshSnapshot = {
  body: ArrayBuffer;
  headers: [string, string][];
  setCookieHeaders: string[];
  status: number;
  statusText: string;
};

const refreshSessionPromises = new Map<string, Promise<RefreshSnapshot>>();

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

  return new Response(snapshot.body.slice(0), {
    headers,
    status: snapshot.status,
    statusText: snapshot.statusText,
  });
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
  const existingRefreshSessionPromise = refreshSessionPromises.get(sessionKey);

  if (existingRefreshSessionPromise) {
    return createSnapshotResponse(await existingRefreshSessionPromise);
  }

  const refreshSessionPromise = refreshBackendSessionSnapshot(cookieHeader);

  refreshSessionPromises.set(sessionKey, refreshSessionPromise);

  try {
    return createSnapshotResponse(await refreshSessionPromise);
  } finally {
    refreshSessionPromises.delete(sessionKey);
  }
}
