import { cache } from "react";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApi } from "@/services/server-api";
import type { AuthUser, CurrentUserResponse } from "@/types/auth";

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const response = await serverApi(API_ENDPOINTS.backend.currentUser.me);

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
    avatarMediaId: response.avatarMediaId,
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
