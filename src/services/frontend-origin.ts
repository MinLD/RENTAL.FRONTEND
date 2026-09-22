function isHttpOrigin(url: URL) {
  return url.protocol === "http:" || url.protocol === "https:";
}

export function getFrontendOrigin(requestOrigin: string) {
  const configuredOrigin = process.env.FRONTEND_ORIGIN;

  if (!configuredOrigin) {
    return requestOrigin;
  }

  const parsedOrigin = new URL(configuredOrigin);

  if (
    !isHttpOrigin(parsedOrigin) ||
    parsedOrigin.pathname !== "/" ||
    parsedOrigin.search ||
    parsedOrigin.hash
  ) {
    throw new Error("FRONTEND_ORIGIN must be an absolute HTTP(S) origin.");
  }

  return parsedOrigin.origin;
}
