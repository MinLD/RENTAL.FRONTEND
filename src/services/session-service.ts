import { cache } from "react";

import { serverApi } from "@/services/server-api";
import type { AuthUser, CurrentUserResponse } from "@/types/auth";

const AUTH_ME_ENDPOINT = "/api/v1/auth/users/me";

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const response = await serverApi(AUTH_ME_ENDPOINT);

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
