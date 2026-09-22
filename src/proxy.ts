import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE_NAMES,
  clearAuthCookies,
  copyAuthCookies,
  mergeAuthCookiesIntoCookieHeader,
} from "@/services/auth-cookie";
import { refreshBackendSession } from "@/services/auth-refresh";
import { shouldRefreshJwtToken } from "@/services/auth-token";
import { buildBackendApiUrl } from "@/services/backend-api";

const REFRESH_BUFFER_SECONDS = 60;
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

function hasAnyAuthCookie(request: NextRequest) {
  return hasAuthToken(request) || hasRefreshToken(request);
}

function shouldRefreshRequestSession(request: NextRequest) {
  if (!hasRefreshToken(request)) {
    return false;
  }

  const accessToken = request.cookies.get(AUTH_COOKIE_NAMES[0])?.value;

  if (!accessToken) {
    return true;
  }

  const shouldRefresh = shouldRefreshJwtToken(
    accessToken,
    REFRESH_BUFFER_SECONDS,
  );

  return shouldRefresh ?? true;
}

async function validateRequestSession(
  request: NextRequest,
  redirectAuthenticatedUser = false,
) {
  if (!hasAnyAuthCookie(request)) {
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

      if (currentUserResponse.ok) {
        return redirectAuthenticatedUser
          ? NextResponse.redirect(new URL("/", request.url))
          : null;
      }

      if (currentUserResponse.status !== 401) {
        return null;
      }
    }

    if (!hasRefreshToken(request)) {
      const response = NextResponse.next();
      clearAuthCookies(response);

      return response;
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

    const response = redirectAuthenticatedUser
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

async function refreshRequestSession(request: NextRequest) {
  if (!shouldRefreshRequestSession(request)) {
    return null;
  }

  try {
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

  if (hasAnyAuthCookie(request)) {
    const authRouteResponse = await validateRequestSession(
      request,
      isAuthRoute(request.nextUrl.pathname),
    );

    if (authRouteResponse) {
      return authRouteResponse;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
