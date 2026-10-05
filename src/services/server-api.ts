import { headers as getRequestHeaders } from "next/headers";

import { mergeAuthCookiesIntoCookieHeader } from "@/services/auth-cookie";
import {
  isAuthRefreshEndpoint,
  refreshBackendSession,
} from "@/services/auth-refresh";
import { buildBackendApiUrl } from "@/services/backend-api";
import { getApiErrorMessage, readResponseJson } from "@/services/api-error";

type ServerApiInit = Omit<RequestInit, "body" | "headers"> & {
  body?: BodyInit | null;
  cookieHeader?: string | null;
  headers?: HeadersInit;
  json?: unknown;
};

export class ServerApiError extends Error {
  readonly responseBody: unknown;
  readonly status: number;
  readonly statusText: string;

  constructor(
    response: Response,
    responseBody: unknown,
    fallbackMessage: string,
  ) {
    super(getApiErrorMessage(responseBody) ?? fallbackMessage);
    this.name = "ServerApiError";
    this.responseBody = responseBody;
    this.status = response.status;
    this.statusText = response.statusText;
  }
}

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

export async function serverApiOk(
  endpoint: string,
  fallbackMessage: string,
  init?: ServerApiInit,
) {
  const response = await serverApi(endpoint, init);

  if (!response.ok) {
    throw new ServerApiError(
      response,
      await readResponseJson(response),
      fallbackMessage,
    );
  }

  return response;
}

export async function serverApiJson<TResponse>(
  endpoint: string,
  fallbackMessage: string,
  init?: ServerApiInit,
): Promise<TResponse> {
  const response = await serverApiOk(endpoint, fallbackMessage, init);

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}
