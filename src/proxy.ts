import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE_NAMES,
  clearAuthCookies,
  copyAuthCookies,
  mergeAuthCookiesIntoCookieHeader,
} from "@/services/auth-cookie";
import { refreshBackendSession } from "@/services/auth-refresh";
import { buildBackendApiUrl } from "@/services/backend-api";

const AUTH_ME_ENDPOINT = "/api/v1/auth/users/me";

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/supplier-register",
] as const;

function hasAuthToken(request: NextRequest) {
  return Boolean(request.cookies.get(AUTH_COOKIE_NAMES[0])?.value);
}

function hasRefreshToken(request: NextRequest) {
  return Boolean(request.cookies.get(AUTH_COOKIE_NAMES[1])?.value);
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

async function refreshRequestSession(request: NextRequest) {
  if (!hasRefreshToken(request)) {
    return null;
  }

  try {
    if (hasAuthToken(request)) {
      const currentUserResponse = await fetch(
        buildBackendApiUrl(AUTH_ME_ENDPOINT),
        {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Cookie: request.headers.get("cookie") ?? "",
          },
        },
      );

      if (currentUserResponse.status !== 401) {
        return null;
      }
    }

    const refreshResponse = await refreshBackendSession(
      request.headers.get("cookie"),
    );

    if (!refreshResponse.ok) {
      const response = NextResponse.next();

      if (refreshResponse.status === 401) {
        clearAuthCookies(response);
      }

      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "cookie",
      mergeAuthCookiesIntoCookieHeader(
        request.headers.get("cookie"),
        refreshResponse.headers,
      ),
    );

    const response = isAuthRoute(request.nextUrl.pathname)
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

    copyAuthCookies(refreshResponse.headers, response);

    return response;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const refreshResponse = await refreshRequestSession(request);

  if (refreshResponse) {
    return refreshResponse;
  }

  if (
    (hasAuthToken(request) || hasRefreshToken(request)) &&
    isAuthRoute(request.nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
