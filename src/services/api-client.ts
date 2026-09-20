type ApiClientInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
  json?: unknown;
};

let refreshSessionPromise: Promise<void> | null = null;

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

  if (endpoint.startsWith("/api/auth/")) {
    return endpoint;
  }

  return new URL(endpoint.replace(/^\/+/, ""), `${getApiBaseUrl()}/`).toString();
};

const buildAuthenticatedApiUrl = (endpoint: string) => {
  if (/^[a-z][a-z\d+.-]*:/i.test(endpoint)) {
    throw new Error("API endpoints must be relative paths.");
  }

  if (endpoint.startsWith("/api/auth/")) {
    return endpoint;
  }

  return `/api/backend/${endpoint.replace(/^\/+/, "")}`;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly responseBody: unknown;

  constructor(response: Response, responseBody?: unknown) {
    super(getApiClientErrorMessage(response, responseBody));
    this.name = "ApiClientError";
    this.status = response.status;
    this.statusText = response.statusText;
    this.responseBody = responseBody;
  }
}

function getApiClientErrorMessage(response: Response, responseBody?: unknown) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    "detail" in responseBody &&
    typeof responseBody.detail === "string"
  ) {
    return responseBody.detail;
  }

  if (
    responseBody &&
    typeof responseBody === "object" &&
    "title" in responseBody &&
    typeof responseBody.title === "string"
  ) {
    return responseBody.title;
  }

  return `API request failed: ${response.status} ${response.statusText}`;
}

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
  try {
    return await request(endpoint, init, buildAuthenticatedApiUrl);
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 401) {
      throw error;
    }

    await refreshAuthSession();

    return request(endpoint, init, buildAuthenticatedApiUrl);
  }
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
    let responseBody: unknown;

    try {
      responseBody = await response.clone().json();
    } catch {
      responseBody = undefined;
    }

    throw new ApiClientError(response, responseBody);
  }

  return response;
}

async function refreshAuthSession() {
  refreshSessionPromise ??= apiClient("/api/auth/refresh", {
    method: "POST",
  })
    .then(() => undefined)
    .finally(() => {
      refreshSessionPromise = null;
    });

  return refreshSessionPromise;
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

  if (!contentType?.includes("application/json")) {
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

  if (!contentType?.includes("application/json")) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}
