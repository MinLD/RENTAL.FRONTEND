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
  const [detailRefresh, setDetailRefresh] = useState<(() => void) | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [pendingAction, setPendingAction] = useState<UserPendingAction>(null);

  async function handleViewUser(user: AdminUserRow, refresh?: () => void) {
    setDetailRefresh(() => refresh ?? null);
    setIsLoadingDetail(true);

    try {
      const result = await fetchUserDetail(user.id);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      setDetailUser(result.data);
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
      const result = await createUser(request);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
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
  ) {
    setIsUpdatingUser(true);

    try {
      const updatedUser = await updateUser(id, request);

      if (!updatedUser.success) {
        toast.error(updatedUser.error.message);
        return;
      }

      setDetailUser(updatedUser.data);
      toast.success("Đã cập nhật user.");
      detailRefresh?.();
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
