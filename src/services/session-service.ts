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
    avatarUrl: response.avatarUrl,
    dateOfBirth: response.dateOfBirth,
    email: response.email ?? "",
    hasPassword: response.hasPassword,
    id: response.id,
    identityNumber: response.maskedCitizenId ?? response.identityNumber,
    isProfileCompleted: response.isProfileCompleted,
    name: response.fullName ?? response.email ?? "Người dùng",
    phoneNumber: response.phoneNumber,
    roleLabel: primaryRole ?? "Tài khoản",
  };
}
