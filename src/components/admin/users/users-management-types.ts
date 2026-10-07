import type { ApiResult } from "@/services/api-error";
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
  createUser: (request: CreateAdminUserRequest) => Promise<ApiResult<string>>;
  fetchRoles: () => Promise<ApiResult<AdminRoleOption[]>>;
  fetchUsers: (
    params: DataTableFetchParams<AdminUsersFilterParams>,
  ) => Promise<ApiResult<DataTableFetchResult<AdminUserRow>>>;
  fetchUserDetail: (id: string) => Promise<ApiResult<AdminUserRow>>;
  lockUser: (id: string) => Promise<ApiResult<void>>;
  unlockUser: (id: string) => Promise<ApiResult<void>>;
  updateUser: (
    id: string,
    request: UpdateAdminUserRequest,
  ) => Promise<ApiResult<AdminUserRow>>;
};
