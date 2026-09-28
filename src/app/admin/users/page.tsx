import { UsersManagementTable } from "@/components/admin/users/users-management-table";
import {
  createUserAction,
  deleteUserAction,
  getUserDetailAction,
  getUsersAction,
  lockUserAction,
  unlockUserAction,
} from "@/services/actions/admin-users-actions";

export default function UsersPage() {
  return (
    <UsersManagementTable
      createUser={createUserAction}
      deleteUser={deleteUserAction}
      fetchUserDetail={getUserDetailAction}
      fetchUsers={getUsersAction}
      lockUser={lockUserAction}
      unlockUser={unlockUserAction}
    />
  );
}
