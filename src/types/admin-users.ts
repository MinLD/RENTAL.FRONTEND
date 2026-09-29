export type AdminUserStatus = "active" | "locked";

export type AdminUserRow = {
  avatarMediaId?: string | null;
  avatarUrl?: string | null;
  citizenId?: string | null;
  createdAtUtc?: string;
  dateOfBirth?: string | null;
  email: string;
  globalRoles?: string[];
  id: string;
  name: string;
  phone?: string | null;
  role?: string;
  status: AdminUserStatus;
};

export type CreateAdminUserRequest = {
  email: string;
  fullName: string;
  password: string;
  roleIds?: string[] | null;
};

export type UpdateAdminUserRequest = {
  avatarMediaId?: string | null;
  citizenId?: string | null;
  dateOfBirth?: string | null;
  email?: string | null;
  fullName: string;
  isActive?: boolean | null;
  phoneNumber?: string | null;
  removeAvatar: boolean;
  roleIds?: string[] | null;
};

export type AdminUsersFilterParams = {
  role: string;
  status: "all" | AdminUserStatus;
};

export type AdminRoleOption = {
  description?: string | null;
  id: string;
  name: string | null;
};
