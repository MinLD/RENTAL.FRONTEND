import { UsersManagementTable } from "@/components/admin/users/users-management-table";
import {
  createUserAction,
  getAdminRolesAction,
  getUserDetailAction,
  getUsersAction,
  lockUserAction,
  unlockUserAction,
  updateUserAction,
} from "@/services/actions/admin-users-actions";

export default function UsersPage() {
  return (
    <UsersManagementTable
      createUser={createUserAction}
      fetchRoles={getAdminRolesAction}
      fetchUserDetail={getUserDetailAction}
      fetchUsers={getUsersAction}
      lockUser={lockUserAction}
      unlockUser={unlockUserAction}
      updateUser={updateUserAction}
    />
  );
}
