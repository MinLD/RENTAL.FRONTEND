import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE_NAMES,
  clearAuthCookies,
  copyAuthCookies,
  mergeAuthCookiesIntoCookieHeader,
} from "@/services/auth-cookie";
import { refreshBackendSession } from "@/services/auth-refresh";
import { shouldRefreshJwtToken } from "@/services/auth-token";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { buildBackendApiUrl } from "@/services/backend-api";
import type { AuthUser } from "@/types/auth";

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

const ROLE_ALIASES: Record<(typeof PORTAL_ROUTES)[number]["role"], string[]> = {
  adm: ["adm", "admin", "administrator"],
  com: ["com", "company"],
  sup: ["sup", "supplier"],
};

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

function normalizeRole(role: string) {
  return role.trim().toLowerCase();
}

function hasUserRole(user: AuthUser, role: string) {
  const acceptedRoles = new Set(
    (ROLE_ALIASES[role as (typeof PORTAL_ROUTES)[number]["role"]] ?? [role]).map(
      normalizeRole,
    ),
  );

  return (
    user.roles?.some((userRole) => acceptedRoles.has(normalizeRole(userRole))) ??
    false
  );
}

function getAuthenticatedHomePath(user: AuthUser) {
  const portalRoute = PORTAL_ROUTES.find(({ role }) => hasUserRole(user, role));

  return portalRoute?.path ?? "/";
}

function buildAuthenticatedRedirect(request: NextRequest, user: AuthUser) {
  return NextResponse.redirect(
    new URL(getAuthenticatedHomePath(user), request.url),
  );
}

function buildRouteAccessRedirect(request: NextRequest, user: AuthUser) {
  const pathname = request.nextUrl.pathname;
  const portalRoute = getPortalRoute(pathname);
  const authenticatedHomePath = getAuthenticatedHomePath(user);
  const profileCompleted = user.isProfileCompleted;
  const hasPortalHome = authenticatedHomePath !== "/";

  if (hasPortalHome && !isRouteMatch(pathname, authenticatedHomePath)) {
    return buildAuthenticatedRedirect(request, user);
  }

  if (portalRoute && !hasUserRole(user, portalRoute.role)) {
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
    return buildAuthenticatedRedirect(request, user);
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

async function getBackendCurrentUser(cookieHeader: string | null) {
  try {
    const response = await fetch(
      buildBackendApiUrl(API_ENDPOINTS.backend.currentUser.me),
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AuthUser;
  } catch {
    return null;
  }
}

async function validateRequestSession(request: NextRequest) {
  const originalCookieHeader = request.headers.get("cookie");
  let cookieHeader = originalCookieHeader;
  let refreshResponse: Response | null = null;

  if (shouldRefreshRequestSession(request)) {
    refreshResponse = await refreshBackendSession(originalCookieHeader);

    if (!refreshResponse.ok) {
      return {
        refreshResponse,
        user: null,
      };
    }

    cookieHeader = mergeAuthCookiesIntoCookieHeader(
      originalCookieHeader,
      refreshResponse.headers,
    );
  }

  return {
    cookieHeader,
    refreshResponse,
    user: await getBackendCurrentUser(cookieHeader),
  };
}

function copyRefreshedSessionCookies(
  refreshResponse: Response | null,
  response: NextResponse,
) {
  if (refreshResponse?.ok) {
    copyAuthCookies(refreshResponse.headers, response);
  }
}

function buildInvalidSessionResponse(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = isAuthRoute(pathname)
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/login", request.url));

  clearAuthCookies(response);

  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    (isPortalRoute(pathname) || isAuthenticatedRoute(pathname)) &&
    !hasAnyAuthCookie(request)
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    isAuthRoute(pathname) ||
    isPortalRoute(pathname) ||
    isAuthenticatedRoute(pathname)
  ) {
    const session = await validateRequestSession(request);

    if (!session.user) {
      return buildInvalidSessionResponse(request);
    }

    const routeAccessResponse = buildRouteAccessRedirect(request, session.user);

    if (routeAccessResponse) {
      copyRefreshedSessionCookies(session.refreshResponse, routeAccessResponse);

      return routeAccessResponse;
    }

    if (session.refreshResponse?.ok && session.cookieHeader) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("cookie", session.cookieHeader);
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

      copyAuthCookies(session.refreshResponse.headers, response);

      return response;
    }

    return NextResponse.next();
  }

  if (hasAnyAuthCookie(request)) {
    const refreshResponse = await refreshRequestSession(request);

    if (refreshResponse) {
      return refreshResponse;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
