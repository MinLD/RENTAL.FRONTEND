"use client";

import { useState } from "react";
import { toast } from "sonner";

import type {
  UserPendingAction,
  UsersManagementTableProps,
} from "@/components/admin/users/users-management-types";
import type { AdminUserRow, UpdateAdminUserRequest } from "@/types/admin-users";

export function useAdminUsersController({
  createUser,
  fetchUserDetail,
  updateUser,
}: Pick<
  UsersManagementTableProps,
  "createUser" | "fetchUserDetail" | "updateUser"
>) {
  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [pendingAction, setPendingAction] = useState<UserPendingAction>(null);

  async function handleViewUser(user: AdminUserRow) {
    setIsLoadingDetail(true);

    try {
      setDetailUser(await fetchUserDetail(user.id));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết người dùng.",
      );
    } finally {
      setIsLoadingDetail(false);
    }
  }

  async function handleCreateMockUser(refresh: () => void) {
    setIsCreatingUser(true);

    try {
      await createUser({
        email: "mock.user@lazyops.cloud",
        name: "Mock User",
        phone: "0900000000",
        role: "Customer",
      });
      toast.success("Đã tạo user mock.");
      refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo user mock.",
      );
    } finally {
      setIsCreatingUser(false);
    }
  }

  async function handleUpdateUser(
    id: string,
    request: UpdateAdminUserRequest,
    refresh?: () => void,
  ) {
    setIsUpdatingUser(true);

    try {
      const updatedUser = await updateUser(id, request);

      setDetailUser(updatedUser);
      toast.success("Đã cập nhật user.");
      refresh?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật user.",
      );
    } finally {
      setIsUpdatingUser(false);
    }
  }

  return {
    detailUser,
    handleCreateMockUser,
    handleUpdateUser,
    handleViewUser,
    isCreatingUser,
    isLoadingDetail,
    isUpdatingUser,
    pendingAction,
    setDetailUser,
    setPendingAction,
  };
}
