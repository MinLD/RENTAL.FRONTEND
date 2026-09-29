import type { AuthUser } from "@/types/auth";

export function getAuthUserDisplayName(user?: AuthUser | null) {
  return user?.fullName?.trim() || user?.email?.trim() || "Người dùng";
}

export function getAuthUserRoleLabel(user?: AuthUser | null) {
  const primaryOrganization = user?.organizations?.[0];

  return user?.roles?.[0] ?? primaryOrganization?.roleName ?? "Tài khoản";
}

export function getAuthUserIdentityNumber(user?: AuthUser | null) {
  return user?.maskedCitizenId ?? "";
}
