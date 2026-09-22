import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE_NAMES,
  clearAuthCookies,
  copyAuthCookies,
  getAuthCookieValues,
  mergeAuthCookiesIntoCookieHeader,
} from "@/services/auth-cookie";
import { refreshBackendSession } from "@/services/auth-refresh";
import { hasJwtRole, shouldRefreshJwtToken } from "@/services/auth-token";
import { buildBackendApiUrl } from "@/services/backend-api";

const REFRESH_BUFFER_SECONDS = 60;
const AUTH_ME_ENDPOINT = "/api/v1/auth/users/me";

const PORTAL_ROUTES = [
  {
    path: "/admin",
    role: "adm",
  },
  {
    path: "/company",
    role: "com",
  },
  {
    path: "/supplier",
    role: "sup",
  },
] as const;

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

function getAccessToken(request: NextRequest) {
  return request.cookies.get(AUTH_COOKIE_NAMES[0])?.value ?? null;
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isHomeRoute(pathname: string) {
  return pathname === "/";
}

function hasAnyAuthCookie(request: NextRequest) {
  return hasAuthToken(request) || hasRefreshToken(request);
}

function isRouteMatch(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function getPortalRoute(pathname: string) {
  return PORTAL_ROUTES.find((portalRoute) =>
    isRouteMatch(pathname, portalRoute.path),
  );
}

function isPortalRoute(pathname: string) {
  return Boolean(getPortalRoute(pathname));
}

function getAuthenticatedHomePath(accessToken: string | null | undefined) {
  const portalRoute = PORTAL_ROUTES.find(({ role }) =>
    hasJwtRole(accessToken, role),
  );

  return portalRoute?.path ?? "/";
}

function buildAuthenticatedRedirect(
  request: NextRequest,
  accessToken: string | null | undefined,
) {
  return NextResponse.redirect(
    new URL(getAuthenticatedHomePath(accessToken), request.url),
  );
}

function shouldRefreshRequestSession(request: NextRequest) {
  if (!hasRefreshToken(request)) {
    return false;
  }

  const accessToken = getAccessToken(request);

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
  shouldRedirectAuthenticatedUser = false,
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
        const accessToken = getAccessToken(request);
        const portalRoute = getPortalRoute(request.nextUrl.pathname);
        const authenticatedHomePath = getAuthenticatedHomePath(accessToken);

        if (
          isHomeRoute(request.nextUrl.pathname) &&
          authenticatedHomePath !== "/"
        ) {
          return buildAuthenticatedRedirect(request, accessToken);
        }

        if (portalRoute && !hasJwtRole(accessToken, portalRoute.role)) {
          return NextResponse.redirect(
            new URL(authenticatedHomePath, request.url),
          );
        }

        return shouldRedirectAuthenticatedUser
          ? buildAuthenticatedRedirect(request, accessToken)
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

    const refreshedAccessToken =
      getAuthCookieValues(refreshResponse.headers).accessToken ??
      getAccessToken(request);
    const portalRoute = getPortalRoute(request.nextUrl.pathname);
    const authenticatedHomePath =
      getAuthenticatedHomePath(refreshedAccessToken);

    if (
      isHomeRoute(request.nextUrl.pathname) &&
      authenticatedHomePath !== "/"
    ) {
      const response = NextResponse.redirect(
        new URL(authenticatedHomePath, request.url),
      );

      copyAuthCookies(refreshResponse.headers, response);

      return response;
    }

    if (portalRoute && !hasJwtRole(refreshedAccessToken, portalRoute.role)) {
      const response = NextResponse.redirect(
        new URL(authenticatedHomePath, request.url),
      );

      copyAuthCookies(refreshResponse.headers, response);

      return response;
    }

    const response = shouldRedirectAuthenticatedUser
      ? buildAuthenticatedRedirect(request, refreshedAccessToken)
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

    const refreshedAccessToken =
      getAuthCookieValues(refreshResponse.headers).accessToken ??
      getAccessToken(request);
    const pathname = request.nextUrl.pathname;
    const portalRoute = getPortalRoute(pathname);
    const authenticatedHomePath =
      getAuthenticatedHomePath(refreshedAccessToken);

    if (isHomeRoute(pathname) && authenticatedHomePath !== "/") {
      const response = NextResponse.redirect(
        new URL(authenticatedHomePath, request.url),
      );

      copyAuthCookies(refreshResponse.headers, response);

      return response;
    }

    if (portalRoute && !hasJwtRole(refreshedAccessToken, portalRoute.role)) {
      const response = NextResponse.redirect(
        new URL(authenticatedHomePath, request.url),
      );

      copyAuthCookies(refreshResponse.headers, response);

      return response;
    }

    const response = isAuthRoute(pathname)
      ? buildAuthenticatedRedirect(request, refreshedAccessToken)
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
  if (isPortalRoute(request.nextUrl.pathname) && !hasAnyAuthCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

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
