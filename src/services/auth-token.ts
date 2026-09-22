const JWT_PARTS_LENGTH = 3;

type JwtPayload = {
  exp?: unknown;
};

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  return atob(paddedBase64);
}

export function getJwtExpiration(token: string) {
  try {
    const tokenParts = token.split(".");

    if (tokenParts.length !== JWT_PARTS_LENGTH || !tokenParts[1]) {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(tokenParts[1])) as JwtPayload;

    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export function getJwtMaxAge(token: string) {
  const expiration = getJwtExpiration(token);

  if (!expiration) {
    return undefined;
  }

  const maxAge = expiration - Math.floor(Date.now() / 1000);

  return maxAge > 0 ? maxAge : 0;
}

export function shouldRefreshJwtToken(
  token: string,
  refreshBufferSeconds: number,
) {
  const expiration = getJwtExpiration(token);

  if (!expiration) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  return expiration - now <= refreshBufferSeconds;
}
