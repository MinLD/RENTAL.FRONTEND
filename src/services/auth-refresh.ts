import { buildBackendApiUrl } from "@/services/backend-api";

export const AUTH_REFRESH_ENDPOINT = "/api/v1/auth/refresh";

export function isAuthRefreshEndpoint(endpoint: string) {
  return endpoint.replace(/\/+$/, "") === AUTH_REFRESH_ENDPOINT;
}

export function refreshBackendSession(cookieHeader: string | null) {
  return fetch(buildBackendApiUrl(AUTH_REFRESH_ENDPOINT), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    method: "POST",
  });
}
