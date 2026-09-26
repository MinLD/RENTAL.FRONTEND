import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE_NAMES,
  clearAuthCookies,
  copyAuthCookies,
  getAuthCookieValues,
  mergeAuthCookiesIntoCookieHeader,
} from "@/services/auth-cookie";
import { refreshBackendSession } from "@/services/auth-refresh";
import {
  getJwtProfileCompleted,
  hasJwtRole,
  shouldRefreshJwtToken,
} from "@/services/auth-token";

const REFRESH_BUFFER_SECONDS = 60;
const ACCOUNT_ROUTE = "/account";
const COMPLETE_PROFILE_ROUTE = "/account/complete-profile";

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

const AUTHENTICATED_ROUTES = [ACCOUNT_ROUTE] as const;

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
  return AUTH_ROUTES.some((route) => isRouteMatch(pathname, route));
}

function isAuthenticatedRoute(pathname: string) {
  return AUTHENTICATED_ROUTES.some((route) => isRouteMatch(pathname, route));
}

function isHomeRoute(pathname: string) {
  return pathname === "/";
}

function isCompleteProfileRoute(pathname: string) {
  return isRouteMatch(pathname, COMPLETE_PROFILE_ROUTE);
}

function isAccountProfileRoute(pathname: string) {
  return isRouteMatch(pathname, ACCOUNT_ROUTE);
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

function buildRouteAccessRedirect(
  request: NextRequest,
  accessToken: string | null | undefined,
) {
  const pathname = request.nextUrl.pathname;
  const portalRoute = getPortalRoute(pathname);
  const authenticatedHomePath = getAuthenticatedHomePath(accessToken);
  const profileCompleted = getJwtProfileCompleted(accessToken);

  if (isHomeRoute(pathname) && authenticatedHomePath !== "/") {
    return buildAuthenticatedRedirect(request, accessToken);
  }

  if (portalRoute && !hasJwtRole(accessToken, portalRoute.role)) {
    return NextResponse.redirect(new URL(authenticatedHomePath, request.url));
  }

  if (
    profileCompleted === false &&
    isAccountProfileRoute(pathname) &&
    !isCompleteProfileRoute(pathname)
  ) {
    return NextResponse.redirect(
      new URL(COMPLETE_PROFILE_ROUTE, request.url),
    );
  }

  if (profileCompleted === true && isCompleteProfileRoute(pathname)) {
    return NextResponse.redirect(new URL(ACCOUNT_ROUTE, request.url));
  }

  if (isAuthRoute(pathname)) {
    return buildAuthenticatedRedirect(request, accessToken);
  }

  return null;
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
    const routeAccessResponse = buildRouteAccessRedirect(
      request,
      refreshedAccessToken,
    );

    if (routeAccessResponse) {
      copyAuthCookies(refreshResponse.headers, routeAccessResponse);

      return routeAccessResponse;
    }

    const response = NextResponse.next({
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
  const pathname = request.nextUrl.pathname;

  if (
    (isPortalRoute(pathname) || isAuthenticatedRoute(pathname)) &&
    !hasAnyAuthCookie(request)
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const refreshResponse = await refreshRequestSession(request);

  if (refreshResponse) {
    return refreshResponse;
  }

  if (hasAnyAuthCookie(request)) {
    const authRouteResponse = buildRouteAccessRedirect(
      request,
      getAccessToken(request),
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
