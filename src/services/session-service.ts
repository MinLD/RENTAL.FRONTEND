import { cache } from "react";
import { headers } from "next/headers";

import { mergeAuthCookiesIntoCookieHeader } from "@/services/auth-cookie";
import { refreshBackendSession } from "@/services/auth-refresh";
import { buildBackendApiUrl } from "@/services/backend-api";
import type { AuthUser, CurrentUserResponse } from "@/types/auth";

const AUTH_ME_ENDPOINT = "/api/v1/auth/users/me";

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const requestHeaders = await headers();
    const cookieHeader = requestHeaders.get("cookie");

    let response = await fetchCurrentUser(cookieHeader);

    if (response.status === 401) {
      const refreshResponse = await refreshBackendSession(cookieHeader);

      if (!refreshResponse.ok) {
        return null;
      }

      response = await fetchCurrentUser(
        mergeAuthCookiesIntoCookieHeader(cookieHeader, refreshResponse.headers),
      );
    }

    if (!response.ok) {
      return null;
    }

    const currentUserResponse = (await response.json()) as CurrentUserResponse;

    return mapCurrentUserResponse(currentUserResponse);
  } catch {
    return null;
  }
});

function fetchCurrentUser(cookieHeader: string | null) {
  return fetch(buildBackendApiUrl(AUTH_ME_ENDPOINT), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  });
}

function mapCurrentUserResponse(response: CurrentUserResponse): AuthUser {
  const primaryOrganization = response.organizations?.[0];
  const primaryRole = response.roles?.[0] ?? primaryOrganization?.roleName;

  return {
    email: response.email ?? "",
    id: response.id,
    name: response.fullName ?? response.email ?? "Người dùng",
    roleLabel: primaryRole ?? "Tài khoản",
  };
}
