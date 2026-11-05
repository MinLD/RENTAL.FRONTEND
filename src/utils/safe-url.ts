export function isSafeRelativeUrl(url: unknown): url is string {
  if (typeof url !== "string") {
    return false;
  }
  const trimmed = url.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\")
  ) {
    return false;
  }

  // Reject control characters
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return false;
  }

  // Reject javascript:, data:, vbscript: even with whitespace or mixed-case
  const compact = trimmed.toLowerCase().replace(/\s+/g, "");
  if (
    compact.includes("javascript:") ||
    compact.includes("data:") ||
    compact.includes("vbscript:")
  ) {
    return false;
  }

  // Reject colons in pathname part before query or hash
  const pathPart = trimmed.split(/[?#]/)[0];
  if (pathPart.includes(":")) {
    return false;
  }

  return true;
}

export function getSafeRelativeUrl(
  url: unknown,
  fallback = "/notifications",
): string {
  return isSafeRelativeUrl(url) ? url.trim() : fallback;
}
