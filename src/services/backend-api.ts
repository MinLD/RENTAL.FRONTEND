const API_BASE_URL =
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export function buildBackendApiUrl(endpoint: string) {
  if (!API_BASE_URL) {
    throw new Error(
      "BACKEND_API_URL or NEXT_PUBLIC_API_URL must be configured.",
    );
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(endpoint)) {
    throw new Error("Backend API endpoints must be relative paths.");
  }

  return new URL(endpoint.replace(/^\/+/, ""), `${API_BASE_URL.replace(/\/+$/, "")}/`)
    .toString();
}
