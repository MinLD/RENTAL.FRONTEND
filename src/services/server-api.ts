import { headers as getRequestHeaders } from "next/headers";

import { mergeAuthCookiesIntoCookieHeader } from "@/services/auth-cookie";
import {
  isAuthRefreshEndpoint,
  refreshBackendSession,
} from "@/services/auth-refresh";
import { buildBackendApiUrl } from "@/services/backend-api";

type ServerApiInit = Omit<RequestInit, "body" | "headers"> & {
  body?: BodyInit | null;
  cookieHeader?: string | null;
  headers?: HeadersInit;
  json?: unknown;
};

export async function serverApi(endpoint: string, init?: ServerApiInit) {
  const {
    body,
    cookieHeader,
    headers: initHeaders,
    json,
    ...requestInit
  } = init ?? {};
  const requestHeaders = await getRequestHeaders();
  const headers = new Headers(initHeaders);
  const forwardedCookieHeader = cookieHeader ?? requestHeaders.get("cookie");

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (forwardedCookieHeader) {
    headers.set("Cookie", forwardedCookieHeader);
  }

  const requestBody = json !== undefined ? JSON.stringify(json) : (body ?? null);
  const requestBackend = (cookieHeader?: string | null) => {
    const requestBackendHeaders = new Headers(headers);

    if (cookieHeader) {
      requestBackendHeaders.set("Cookie", cookieHeader);
    }

    return fetch(buildBackendApiUrl(endpoint), {
      ...requestInit,
      body: requestBody,
      cache: requestInit.cache ?? "no-store",
      headers: requestBackendHeaders,
    });
  };

  const response = await requestBackend(forwardedCookieHeader);

  if (response.status !== 401 || isAuthRefreshEndpoint(endpoint)) {
    return response;
  }

  const refreshResponse = await refreshBackendSession(forwardedCookieHeader);

  if (!refreshResponse.ok) {
    return response;
  }

  return requestBackend(
    mergeAuthCookiesIntoCookieHeader(
      forwardedCookieHeader,
      refreshResponse.headers,
    ),
  );
}
