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
    roles.some(isOwnerRole) ||
    (primaryOrganization?.roleName &&
      isOwnerRole(primaryOrganization.roleName))
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

export function isOwnerRole(role?: string | null): boolean {
  if (!role) {
    return false;
  }

  const normalized = role.trim().toLowerCase();
  return (
    normalized === "own" ||
    normalized === "owner" ||
    normalized === "supplier" ||
    normalized === "sup"
  );
}

export function isOwnerUser(user?: {
  globalRoles?: string[] | null;
  role?: string | null;
  roles?: string[] | null;
} | null): boolean {
  if (!user) {
    return false;
  }

  const roles = [
    ...(user.roles ?? []),
    ...(user.globalRoles ?? []),
    ...(user.role ? user.role.split(",").map((r) => r.trim()) : []),
  ];

  return roles.some(isOwnerRole);
}
