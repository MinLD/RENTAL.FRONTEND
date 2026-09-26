const JWT_PARTS_LENGTH = 3;

type JwtPayload = {
  exp?: unknown;
  isProfileCompleted?: unknown;
  p?: unknown;
  r?: unknown;
};

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  return atob(paddedBase64);
}

function getJwtPayload(token: string) {
  try {
    const tokenParts = token.split(".");

    if (tokenParts.length !== JWT_PARTS_LENGTH || !tokenParts[1]) {
      return null;
    }

    return JSON.parse(decodeBase64Url(tokenParts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function getJwtExpiration(token: string) {
  const payload = getJwtPayload(token);

  return typeof payload?.exp === "number" ? payload.exp : null;
}

export function getJwtRoles(token: string) {
  const payload = getJwtPayload(token);
  const roles = payload?.r;

  if (Array.isArray(roles)) {
    return roles.filter((role): role is string => typeof role === "string");
  }

  return typeof roles === "string" ? [roles] : [];
}

export function getJwtPermissions(token: string) {
  const payload = getJwtPayload(token);
  const permissions = payload?.p;

  if (Array.isArray(permissions)) {
    return permissions.filter(
      (permission): permission is string => typeof permission === "string",
    );
  }

  return typeof permissions === "string" ? [permissions] : [];
}

export function getJwtProfileCompleted(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const payload = getJwtPayload(token);
  const profileCompleted = payload?.isProfileCompleted;

  if (typeof profileCompleted === "boolean") {
    return profileCompleted;
  }

  if (typeof profileCompleted === "string") {
    const normalizedValue = profileCompleted.toLowerCase();

    if (normalizedValue === "true") {
      return true;
    }

    if (normalizedValue === "false") {
      return false;
    }
  }

  return null;
}

export function hasJwtRole(token: string | null | undefined, role: string) {
  return token ? getJwtRoles(token).some((jwtRole) => jwtRole === role) : false;
}

export function hasJwtPermission(
  token: string | null | undefined,
  permission: string,
) {
  return token
    ? getJwtPermissions(token).some(
        (jwtPermission) => jwtPermission === permission,
      )
    : false;
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
