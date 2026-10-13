import { cookies, headers as getRequestHeaders } from "next/headers";
import { unstable_rethrow } from "next/navigation";

import {
  clearAuthCookies,
  copyAuthCookies,
  mergeAuthCookiesIntoCookieHeader,
} from "@/services/auth-cookie";
import {
  isAuthRefreshEndpoint,
  refreshBackendSession,
} from "@/services/auth-refresh";
import { buildBackendApiUrl } from "@/services/backend-api";
import {
  ApiError,
  ApiInputError,
  readResponseJson,
} from "@/services/api-error";
import type { ApiResult } from "@/services/api-error";

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
  const cookieStore = await cookies();
  const headers = new Headers(initHeaders);
  const forwardedCookieHeader = cookieHeader ?? cookieStore.toString();

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (forwardedCookieHeader) {
    headers.set("Cookie", forwardedCookieHeader);
  }

  const requestBody =
    json !== undefined ? JSON.stringify(json) : (body ?? null);
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

  // SSR cannot send refreshed cookies to the browser. Its session is renewed
  // in proxy.ts before rendering; never consume a rotating refresh token here.
  if (
    response.status !== 401 ||
    isAuthRefreshEndpoint(endpoint) ||
    !requestHeaders.has("next-action")
  ) {
    return response;
  }

  const refreshResponse = await refreshBackendSession(forwardedCookieHeader);

  if (!refreshResponse.ok) {
    if (refreshResponse.status === 401)
      clearAuthCookies({ cookies: cookieStore });
    return refreshResponse;
  }

  copyAuthCookies(refreshResponse.headers, { cookies: cookieStore });

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
    throw new ApiError(
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

// Return API failures as data across the Server Action/SSR boundary.
export async function serverApiResult<T>(
  request: () => Promise<T>,
): Promise<ApiResult<T>> {
  try {
    return { success: true, data: await request() };
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof ApiError) {
      return { success: false, error: error.details };
    }

    if (error instanceof ApiInputError) {
      return {
        success: false,
        error: {
          message: error.message,
          status: 400,
          fieldErrors: error.fieldErrors,
        },
      };
    }

    console.error("Server API request failed:", error);
    return {
      success: false,
      error: {
        message: "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.",
        status: 500,
        fieldErrors: {},
      },
    };
  }
}
