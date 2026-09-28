import type {
  AdminUserRow,
  CreateAdminUserRequest,
} from "@/types/admin-users";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import type { AdminUsersFilterParams } from "@/types/admin-users";

export type UserPendingAction = {
  action: "delete" | "lock" | "unlock";
  refresh: () => void;
  user: AdminUserRow;
} | null;

export type UsersManagementTableProps = {
  createUser: (request: CreateAdminUserRequest) => Promise<AdminUserRow>;
  deleteUser: (id: string) => Promise<void>;
  fetchUsers: (
    params: DataTableFetchParams<AdminUsersFilterParams>,
  ) => Promise<DataTableFetchResult<AdminUserRow>>;
  fetchUserDetail: (id: string) => Promise<AdminUserRow>;
  lockUser: (id: string) => Promise<void>;
  unlockUser: (id: string) => Promise<void>;
};
