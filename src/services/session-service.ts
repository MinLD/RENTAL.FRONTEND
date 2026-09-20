import { cache } from "react";
import { headers } from "next/headers";

import { buildBackendApiUrl } from "@/services/backend-api";
import type { AuthUser, CurrentUserResponse } from "@/types/auth";

const AUTH_ME_ENDPOINT = "/api/v1/auth/users/me";

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const requestHeaders = await headers();
    const cookieHeader = requestHeaders.get("cookie");

    const response = await fetch(buildBackendApiUrl(AUTH_ME_ENDPOINT), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    if (!response.ok) {
      return null;
    }

    const currentUserResponse = (await response.json()) as CurrentUserResponse;

    return mapCurrentUserResponse(currentUserResponse);
  } catch {
    return null;
  }
});

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
