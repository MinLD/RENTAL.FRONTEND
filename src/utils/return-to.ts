const LOCAL_ORIGIN = "https://dprental.invalid";
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/supplier-register"];

export type ReturnToSearchParams = Record<string, string | string[] | undefined>;

export function getSafeReturnTo(value?: string | null): string | null {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value, LOCAL_ORIGIN);
    // Encoded delimiters or nested escapes can disguise another destination.
    if (/%(?:25|2f|5c|3f|23)/i.test(url.pathname)) return null;
    const decodedPath = decodeURIComponent(url.pathname);
    if (/[\\\u0000-\u001f\u007f]/.test(decodedPath)) return null;
    const decodedUrl = new URL(decodedPath, LOCAL_ORIGIN);
    if (url.origin !== LOCAL_ORIGIN || decodedUrl.origin !== LOCAL_ORIGIN) return null;
    const forbidden = [...AUTH_PATHS, "/api", "/_next"];
    if (forbidden.some((path) => decodedUrl.pathname === path || decodedUrl.pathname.startsWith(`${path}/`))) return null;
    url.searchParams.delete("_rsc");
    return `${decodedUrl.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

// The page URL is supplied by the app; only returnTo comes from navigation/user input.
export function withReturnTo(page: string, returnTo?: string | null) {
  const url = new URL(page, LOCAL_ORIGIN);
  const destination = getSafeReturnTo(returnTo);
  if (destination) url.searchParams.set("returnTo", destination);
  return `${url.pathname}${url.search}${url.hash}`;
}
