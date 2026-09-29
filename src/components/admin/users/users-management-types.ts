import type {
  AdminRoleOption,
  AdminUserRow,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from "@/types/admin-users";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import type { AdminUsersFilterParams } from "@/types/admin-users";

export type UserPendingAction = {
  action: "lock" | "unlock";
  refresh: () => void;
  user: AdminUserRow;
} | null;

export type UsersManagementTableProps = {
  createUser: (request: CreateAdminUserRequest) => Promise<string>;
  fetchRoles: () => Promise<AdminRoleOption[]>;
  fetchUsers: (
    params: DataTableFetchParams<AdminUsersFilterParams>,
  ) => Promise<DataTableFetchResult<AdminUserRow>>;
  fetchUserDetail: (id: string) => Promise<AdminUserRow>;
  lockUser: (id: string) => Promise<void>;
  unlockUser: (id: string) => Promise<void>;
  updateUser: (
    id: string,
    request: UpdateAdminUserRequest,
  ) => Promise<AdminUserRow>;
};
