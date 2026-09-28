export type AdminUserStatus = "active" | "locked";

export type AdminUserRow = {
  avatarUrl?: string;
  createdAtUtc?: string;
  email: string;
  globalRoles?: string[];
  id: string;
  name: string;
  phone?: string;
  role?: string;
  status: AdminUserStatus;
};

export type CreateAdminUserRequest = {
  email: string;
  name: string;
  phone: string;
  role: string;
};

export type AdminUsersFilterParams = {
  role: string;
  status: "all" | AdminUserStatus;
};
