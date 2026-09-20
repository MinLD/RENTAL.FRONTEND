import type { AuthUser, CurrentUserResponse } from "@/types/auth";

export function mapCurrentUserResponse(response: CurrentUserResponse): AuthUser {
  const primaryOrganization = response.organizations?.[0];
  const primaryRole = response.roles?.[0] ?? primaryOrganization?.roleName;

  return {
    email: response.email ?? "",
    id: response.id,
    name: response.fullName ?? response.email ?? "Người dùng",
    roleLabel: primaryRole ?? "Tài khoản",
  };
}
