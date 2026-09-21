import { NextResponse } from "next/server";

export const AUTH_COOKIE_NAMES = ["accessToken", "refreshToken"] as const;

type CookieAttributes = {
  expires?: Date;
  maxAge?: number;
};

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
  const setCookieHeaders = getSetCookieHeaders(backendHeaders);

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

    response.cookies.set(cookieName, value, {
      ...getCookieAttributes(setCookieHeader),
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
