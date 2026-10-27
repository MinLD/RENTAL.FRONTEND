import type { AuthUser } from "@/types/auth";

export function getAuthUserDisplayName(user?: AuthUser | null) {
  return user?.fullName?.trim() || user?.email?.trim() || "Người dùng";
}

export function getAuthUserRoleLabel(user?: AuthUser | null) {
  const roles = user?.roles?.map((r) => r.trim().toLowerCase()) ?? [];
  const primaryOrganization = user?.organizations?.[0];

  if (roles.some((r) => ["adm", "admin", "administrator"].includes(r))) {
    return "Quản trị viên";
  }

  if (
    roles.some((r) => ["own", "owner", "supplier", "sup"].includes(r)) ||
    (primaryOrganization?.roleName &&
      ["owner", "own", "supplier"].includes(primaryOrganization.roleName.toLowerCase()))
  ) {
    return "Chủ thiết bị";
  }

  if (roles.includes("customer")) {
    return "Khách hàng";
  }

  return user?.roles?.[0] ?? primaryOrganization?.roleName ?? "Tài khoản";
}

export function getAuthUserIdentityNumber(user?: AuthUser | null) {
  return user?.maskedCitizenId ?? "";
}
