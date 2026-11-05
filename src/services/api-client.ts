import { API_ENDPOINT_PREFIXES } from "../config/api-endpoints.ts";
import { ApiError, readResponseJson } from "./api-error.ts";

type ApiClientInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
  json?: unknown;
};

const getApiBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return baseUrl.replace(/\/+$/, "");
};

const buildApiUrl = (endpoint: string) => {
  if (/^[a-z][a-z\d+.-]*:/i.test(endpoint)) {
    throw new Error("API endpoints must be relative paths.");
  }

  if (
    endpoint.startsWith(API_ENDPOINT_PREFIXES.internalAuth) ||
    endpoint.startsWith(API_ENDPOINT_PREFIXES.internalMock)
  ) {
    return endpoint;
  }

  return new URL(endpoint.replace(/^\/+/, ""), `${getApiBaseUrl()}/`).toString();
};

const buildAuthenticatedApiUrl = (endpoint: string) => {
  if (/^[a-z][a-z\d+.-]*:/i.test(endpoint)) {
    throw new Error("API endpoints must be relative paths.");
  }

  if (
    endpoint.startsWith(API_ENDPOINT_PREFIXES.internalAuth) ||
    endpoint.startsWith(API_ENDPOINT_PREFIXES.internalMock)
  ) {
    return endpoint;
  }

  return `/api/backend/${endpoint.replace(/^\/+/, "")}`;
};

export async function apiClient(
  endpoint: string,
  init?: ApiClientInit,
): Promise<Response> {
  return request(endpoint, init, buildApiUrl);
}

export async function authApiClient(
  endpoint: string,
  init?: ApiClientInit,
): Promise<Response> {
  return request(endpoint, init, buildAuthenticatedApiUrl);
}

async function request(
  endpoint: string,
  init: ApiClientInit | undefined,
  buildUrl: (endpoint: string) => string,
): Promise<Response> {
  const {
    body,
    credentials,
    headers: initHeaders,
    json,
    ...requestInit
  } = init ?? {};
  const headers = new Headers(initHeaders);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(endpoint), {
    ...requestInit,
    body: json !== undefined ? JSON.stringify(json) : (body ?? null),
    credentials: credentials ?? "include",
    headers,
  });

  if (!response.ok) {
    throw new ApiError(response, await readResponseJson(response));
  }

  return response;
}

export async function apiClientJson<TResponse>(
  endpoint: string,
  init?: ApiClientInit,
): Promise<TResponse> {
  const response = await apiClient(endpoint, init);

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("Content-Type");

  if (
    !contentType?.includes("application/json") &&
    !contentType?.includes("+json")
  ) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export async function authApiClientJson<TResponse>(
  endpoint: string,
  init?: ApiClientInit,
): Promise<TResponse> {
  const response = await authApiClient(endpoint, init);

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("Content-Type");

  if (
    !contentType?.includes("application/json") &&
    !contentType?.includes("+json")
  ) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}
