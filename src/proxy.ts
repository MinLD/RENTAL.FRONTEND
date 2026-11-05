import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_COOKIE_NAMES,
  clearAuthCookies,
  copyAuthCookies,
  getAuthCookieValues,
  mergeAuthCookiesIntoCookieHeader,
} from "@/services/auth-cookie";
import { refreshBackendSession } from "@/services/auth-refresh";
import { logAuthFailure } from "@/services/auth-diagnostics";
import { getJwtRoles, shouldRefreshJwtToken } from "@/services/auth-token";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { buildBackendApiUrl } from "@/services/backend-api";
import type { AuthUser } from "@/types/auth";
import { authPageHref, getSafeReturnTo } from "@/utils/auth-redirect";

const REFRESH_BUFFER_SECONDS = 10;
const ACCOUNT_ROUTE = "/account";
const PARTNER_ROUTE = "/partner";

const PORTAL_ROUTES = [
  {
    path: "/admin",
    role: "adm",
  },
  {
    path: "/own",
    role: "own",
  },
] as const;

const ROLE_ALIASES: Record<(typeof PORTAL_ROUTES)[number]["role"], string[]> = {
  adm: ["adm"],
  own: ["own"],
};

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/supplier-register",
] as const;

const AUTHENTICATED_ROUTES = [ACCOUNT_ROUTE, PARTNER_ROUTE] as const;

type RouteAuthState = {
  roles: string[];
};

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

function hasRouteRole(authState: RouteAuthState, role: string) {
  const acceptedRoles = new Set(
    (
      ROLE_ALIASES[role as (typeof PORTAL_ROUTES)[number]["role"]] ?? [role]
    ).map(normalizeRole),
  );

  return authState.roles.some((userRole) =>
    acceptedRoles.has(normalizeRole(userRole)),
  );
}

function getAuthenticatedHomePath(authState: RouteAuthState) {
  const portalRoute = PORTAL_ROUTES.find(({ role }) =>
    hasRouteRole(authState, role),
  );

  return portalRoute?.path ?? "/";
}

function buildAuthenticatedRedirect(
  request: NextRequest,
  authState: RouteAuthState,
) {
  const homePath = getAuthenticatedHomePath(authState);
  const returnTo = isAuthRoute(request.nextUrl.pathname)
    ? getSafeReturnTo(request.nextUrl.searchParams.get("returnTo"))
    : null;
  let target = homePath;
  if (returnTo) {
    const pathname = new URL(returnTo, request.url).pathname;
    const portal = getPortalRoute(pathname);
    // Preserve the existing portal policy when honoring a requested destination.
    const isCustomer = authState.roles.some((role) => role.trim().toLowerCase() === "cus");
    const permitted = isCustomer
      ? !portal || hasRouteRole(authState, portal.role)
      : homePath !== "/"
        ? isRouteMatch(pathname, homePath)
        : !portal || hasRouteRole(authState, portal.role);
    if (permitted) target = returnTo;
  }
  return NextResponse.redirect(
    new URL(target, request.url),
  );
}

function buildLoginRequiredRedirect(request: NextRequest) {
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(new URL(authPageHref("/login", returnTo, true), request.url));
}

function buildRouteAccessRedirect(
  request: NextRequest,
  authState: RouteAuthState,
) {
  const pathname = request.nextUrl.pathname;
  const portalRoute = getPortalRoute(pathname);
  const authenticatedHomePath = getAuthenticatedHomePath(authState);
  const isCustomer = authState.roles.some((role) => role.trim().toLowerCase() === "cus");

  if (portalRoute) {
    if (!hasRouteRole(authState, portalRoute.role)) {
      const fallback = isCustomer ? "/" : authenticatedHomePath;
      return NextResponse.redirect(new URL(fallback, request.url));
    }
    return null;
  }

  if (isAuthRoute(pathname)) {
    return buildAuthenticatedRedirect(request, authState);
  }

  if (!isCustomer) {
    const hasPortalHome = authenticatedHomePath !== "/";
    if (hasPortalHome && !isRouteMatch(pathname, authenticatedHomePath)) {
      return buildAuthenticatedRedirect(request, authState);
    }
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

async function getBackendCurrentUser(cookieHeader: string | null) {
  return fetch(buildBackendApiUrl(API_ENDPOINTS.backend.currentUser.me), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  });
}

async function validateRequestSession(request: NextRequest): Promise<{
  cookieHeader: string | null;
  refreshResponse: Response | null;
  user: AuthUser | null;
  invalidSession: boolean;
  status: number;
}> {
  const originalCookieHeader = request.headers.get("cookie");
  let cookieHeader = originalCookieHeader;
  let refreshResponse: Response | null = null;
  const refresh = async () => {
    refreshResponse = await refreshBackendSession(originalCookieHeader);
    if (refreshResponse.ok) {
      cookieHeader = mergeAuthCookiesIntoCookieHeader(
        originalCookieHeader,
        refreshResponse.headers,
      );
    }
    return refreshResponse;
  };

  try {
    if (shouldRefreshRequestSession(request)) {
      const response = await refresh();
      if (!response.ok) {
        return {
          refreshResponse,
          cookieHeader,
          user: null,
          invalidSession: response.status === 401,
          status: response.status,
        };
      }
    }

    let userResponse = await getBackendCurrentUser(cookieHeader);
    // A backend may reject a token before its JWT exp; retry on actual 401,
    // never on a permission error, network failure or 5xx.
    if (
      userResponse.status === 401 &&
      !refreshResponse &&
      hasRefreshToken(request)
    ) {
      await logAuthFailure("current-user-before-refresh", userResponse);
      const response = await refresh();
      if (!response.ok) {
        return {
          refreshResponse,
          cookieHeader,
          user: null,
          invalidSession: response.status === 401,
          status: response.status,
        };
      }
      userResponse = await getBackendCurrentUser(cookieHeader);
    }

    if (!userResponse.ok) {
      await logAuthFailure("current-user", userResponse);
      return {
        refreshResponse,
        cookieHeader,
        user: null,
        // If refresh succeeded, a downstream 401 does not prove that the
        // refresh token expired. Keep its newly issued cookies for recovery.
        invalidSession:
          userResponse.status === 401 && !hasRefreshToken(request),
        status: userResponse.status === 401 ? 503 : userResponse.status,
      };
    }

    return {
      refreshResponse,
      cookieHeader,
      user: (await userResponse.json()) as AuthUser,
      invalidSession: false,
      status: 200,
    };
  } catch {
    console.warn("Authentication request failed", {
      stage: "validate-session",
      code: "UPSTREAM_UNAVAILABLE",
    });
    return {
      refreshResponse,
      cookieHeader,
      user: null,
      invalidSession: false,
      status: 503,
    };
  }
}

function buildUnavailableSessionResponse(request: NextRequest, status: number) {
  if (
    !isPortalRoute(request.nextUrl.pathname) &&
    !isAuthenticatedRoute(request.nextUrl.pathname)
  ) {
    return NextResponse.next();
  }
  return NextResponse.json(
    {
      message:
        status === 403
          ? "Bạn không có quyền truy cập trang này."
          : "Chưa thể xác thực phiên đăng nhập. Vui lòng tải lại trang để thử lại.",
    },
    {
      status: status === 403 ? 403 : 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "5" },
    },
  );
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
  const response =
    isAuthRoute(pathname) ||
    (!isPortalRoute(pathname) && !isAuthenticatedRoute(pathname))
      ? NextResponse.next()
      : buildLoginRequiredRedirect(request);

  clearAuthCookies(response);

  return response;
}

function getValidatedRouteAuthState(
  request: NextRequest,
  user: AuthUser,
  refreshResponse: Response | null,
): RouteAuthState {
  const refreshedAccessToken = refreshResponse
    ? getAuthCookieValues(refreshResponse.headers).accessToken
    : undefined;
  const accessToken = refreshedAccessToken ?? getAccessToken(request);
  const jwtRoles = accessToken ? getJwtRoles(accessToken) : [];

  return {
    roles: jwtRoles.length ? jwtRoles : (user.roles ?? []),
  };
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    (isPortalRoute(pathname) || isAuthenticatedRoute(pathname)) &&
    !hasAnyAuthCookie(request)
  ) {
    return buildLoginRequiredRedirect(request);
  }

  if (hasAnyAuthCookie(request)) {
    const session = await validateRequestSession(request);

    if (!session.user) {
      if (session.invalidSession) return buildInvalidSessionResponse(request);
      const response = buildUnavailableSessionResponse(request, session.status);
      copyRefreshedSessionCookies(session.refreshResponse, response);
      return response;
    }

    const authState = getValidatedRouteAuthState(
      request,
      session.user,
      session.refreshResponse,
    );
    const routeAccessResponse = buildRouteAccessRedirect(request, authState);

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

  return NextResponse.next();
}

export const config = {
  // The Hub authenticates its own JWT; page role redirects must not intercept negotiate/upgrade.
  matcher: ["/((?!api|hubs|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
