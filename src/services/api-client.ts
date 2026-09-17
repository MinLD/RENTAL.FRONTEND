const getApiBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return `${baseUrl.replace(/\/+$/, "")}/`;
};

const buildApiUrl = (endpoint: string) => {
  if (/^[a-z][a-z\d+.-]*:/i.test(endpoint)) {
    throw new Error("API endpoints must be relative paths.");
  }

  return new URL(endpoint.replace(/^\/+/, ""), getApiBaseUrl()).toString();
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor(response: Response) {
    super(`API request failed: ${response.status} ${response.statusText}`);
    this.name = "ApiClientError";
    this.status = response.status;
    this.statusText = response.statusText;
  }
}

export async function apiClient(
  endpoint: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(buildApiUrl(endpoint), {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new ApiClientError(response);
  }

  return response;
}
