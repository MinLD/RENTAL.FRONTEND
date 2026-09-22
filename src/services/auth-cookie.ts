import { NextResponse } from "next/server";

export const AUTH_COOKIE_NAMES = ["accessToken", "refreshToken"] as const;

type CookieAttributes = {
  expires?: Date;
  maxAge?: number;
};

type AuthCookieValues = Partial<
  Record<(typeof AUTH_COOKIE_NAMES)[number], string>
>;

function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,]+=)/g).map((value) => value.trim());
}

export function getSetCookieHeaders(headers: Headers) {
  const headersWithGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithGetSetCookie.getSetCookie === "function") {
    return headersWithGetSetCookie.getSetCookie();
  }

  const setCookie = headers.get("set-cookie");

  if (!setCookie) {
    return [];
  }

  return splitSetCookieHeader(setCookie);
}

function getCookieValue(setCookieHeader: string, cookieName: string) {
  const prefix = `${cookieName}=`;

  if (!setCookieHeader.startsWith(prefix)) {
    return null;
  }

  return setCookieHeader.slice(prefix.length).split(";")[0] ?? null;
}

function parseCookieHeader(cookieHeader: string | null | undefined) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");
    const value = rawValueParts.join("=");

    if (!rawName || !value) {
      continue;
    }

    cookies.set(rawName, value);
  }

  return cookies;
}

function getCookieAttributes(setCookieHeader: string): CookieAttributes {
  const attributes = setCookieHeader.split(";").slice(1);
  const cookieAttributes: CookieAttributes = {};

  for (const attribute of attributes) {
    const [rawName, ...rawValueParts] = attribute.trim().split("=");
    const name = rawName.toLowerCase();
    const value = rawValueParts.join("=");

    if (name === "expires" && value) {
      const expires = new Date(value);

      if (!Number.isNaN(expires.getTime())) {
        cookieAttributes.expires = expires;
      }
    }

    if (name === "max-age" && value) {
      const maxAge = Number(value);

      if (Number.isFinite(maxAge)) {
        cookieAttributes.maxAge = maxAge;
      }
    }
  }

  return cookieAttributes;
}

export function copyAuthCookies(
  backendHeaders: Headers,
  response: NextResponse,
) {
  const authCookies = getAuthCookieValues(backendHeaders);

  for (const cookieName of AUTH_COOKIE_NAMES) {
    const value = authCookies[cookieName];

    if (!value) {
      continue;
    }

    const setCookieHeader = getSetCookieHeaders(backendHeaders).find((header) =>
      header.startsWith(`${cookieName}=`),
    );

    response.cookies.set(cookieName, value, {
      ...(setCookieHeader ? getCookieAttributes(setCookieHeader) : {}),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  for (const cookieName of AUTH_COOKIE_NAMES) {
    response.cookies.set(cookieName, "", {
      expires: new Date(0),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}

export function setAuthCookies(
  response: NextResponse,
  tokens: Record<(typeof AUTH_COOKIE_NAMES)[number], string>,
) {
  for (const cookieName of AUTH_COOKIE_NAMES) {
    response.cookies.set(cookieName, tokens[cookieName], {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}

export function getAuthCookieValues(backendHeaders: Headers): AuthCookieValues {
  const setCookieHeaders = getSetCookieHeaders(backendHeaders);
  const authCookies: AuthCookieValues = {};

  for (const cookieName of AUTH_COOKIE_NAMES) {
    const setCookieHeader = setCookieHeaders.find((header) =>
      header.startsWith(`${cookieName}=`),
    );

    if (!setCookieHeader) {
      continue;
    }

    const value = getCookieValue(setCookieHeader, cookieName);

    if (value === null) {
      continue;
    }

    authCookies[cookieName] = value;
  }

  return authCookies;
}

export function mergeAuthCookiesIntoCookieHeader(
  cookieHeader: string | null | undefined,
  backendHeaders: Headers,
) {
  const cookies = parseCookieHeader(cookieHeader);
  const authCookies = getAuthCookieValues(backendHeaders);

  for (const cookieName of AUTH_COOKIE_NAMES) {
    const value = authCookies[cookieName];

    if (value) {
      cookies.set(cookieName, value);
    }
  }

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}
