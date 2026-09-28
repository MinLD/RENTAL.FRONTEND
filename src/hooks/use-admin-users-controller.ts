"use client";

import { useState } from "react";
import { toast } from "sonner";

import type {
  UserPendingAction,
  UsersManagementTableProps,
} from "@/components/admin/users/users-management-types";
import type {
  AdminUserRow,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from "@/types/admin-users";

export function useAdminUsersController({
  createUser,
  fetchUserDetail,
  updateUser,
}: Pick<
  UsersManagementTableProps,
  "createUser" | "fetchUserDetail" | "updateUser"
>) {
  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);
  const [createUserRefresh, setCreateUserRefresh] = useState<
    (() => void) | null
  >(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
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

  function handleOpenCreateUser(refresh: () => void) {
    setCreateUserRefresh(() => refresh);
    setIsCreateDrawerOpen(true);
  }

  async function handleCreateUser(request: CreateAdminUserRequest) {
    setIsCreatingUser(true);

    try {
      await createUser(request);
      toast.success("Đã tạo user.");
      setIsCreateDrawerOpen(false);
      createUserRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo user.");
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
    handleCreateUser,
    handleOpenCreateUser,
    handleUpdateUser,
    handleViewUser,
    isCreateDrawerOpen,
    isCreatingUser,
    isLoadingDetail,
    isUpdatingUser,
    pendingAction,
    setIsCreateDrawerOpen,
    setDetailUser,
    setPendingAction,
  };
}
