const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function buildBackendApiUrl(endpoint: string) {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(endpoint)) {
    throw new Error("Backend API endpoints must be relative paths.");
  }

  return new URL(endpoint.replace(/^\/+/, ""), `${API_BASE_URL.replace(/\/+$/, "")}/`)
    .toString();
}
