const INTERNAL_API_BASE_URL =
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function buildApiUrl(endpoint: string, baseUrl: string | undefined, settingName: string) {
  if (!baseUrl) {
    throw new Error(
      `${settingName} must be configured.`,
    );
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(endpoint)) {
    throw new Error("Backend API endpoints must be relative paths.");
  }

  return new URL(endpoint.replace(/^\/+/, ""), `${baseUrl.replace(/\/+$/, "")}/`)
    .toString();
}

// Server-side BFF fetches stay inside the Docker network when configured.
export function buildBackendApiUrl(endpoint: string) {
  return buildApiUrl(
    endpoint,
    INTERNAL_API_BASE_URL,
    "BACKEND_API_URL or NEXT_PUBLIC_API_URL",
  );
}

// OAuth must redirect the browser through the public Gateway origin so the
// browser can receive the provider and correlation-cookie redirects.
export function buildPublicBackendApiUrl(endpoint: string) {
  return buildApiUrl(endpoint, PUBLIC_API_BASE_URL, "NEXT_PUBLIC_API_URL");
}
