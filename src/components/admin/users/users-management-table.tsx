"use client";

import {
  Eye,
  LockKeyhole,
  Plus,
  UnlockKeyhole,
} from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useAdminUsersController } from "@/hooks/use-admin-users-controller";

import { UserActionDialog } from "./user-action-dialog";
import { UserCreateDrawer } from "./user-create-drawer";
import { UserDetailDrawer } from "./user-detail";
import type { UsersManagementTableProps } from "./users-management-types";
import { userColumns } from "./users-table-columns";

export function UsersManagementTable({
  createUser,
  fetchRoles,
  fetchUsers,
  fetchUserDetail,
  lockUser,
  unlockUser,
  updateUser,
}: UsersManagementTableProps) {
  const {
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
  } = useAdminUsersController({
    createUser,
    fetchUserDetail,
    updateUser,
  });

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <DataTable
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={userColumns}
        csvColumns={[
          { header: "ID", value: "id" },
          { header: "Tên", value: "name" },
          { header: "Email", value: "email" },
          {
            header: "Ngày tạo",
            value: (user) => formatDateTime(user.createdAtUtc),
          },
          {
            header: "Vai trò",
            value: (user) => user.globalRoles?.join(", ") ?? "",
          },
          {
            header: "Trạng thái",
            value: (user) =>
              user.status === "active" ? "Hoạt động" : "Tạm khóa",
          },
        ]}
        csvFilename="danh-sach-nguoi-dung.csv"
        description="Quản trị tài khoản hệ thống"
        detailDescription={(user) => user.email}
        detailTitle={(user) => user.name}
        fetchData={fetchUsers}
        getRowId={(user) => user.id}
        initialPageSize={25}
        onRowDoubleClick={handleViewUser}
        renderRowActions={(user, { refresh }) => (
          <div className="flex justify-end gap-1">
            <Button
              aria-label="Xem chi tiết"
              disabled={isLoadingDetail}
              onClick={() => {
                void handleViewUser(user, refresh);
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              aria-label={user.status === "active" ? "Tạm khóa" : "Mở khóa"}
              className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              onClick={() =>
                setPendingAction({
                  action: user.status === "active" ? "lock" : "unlock",
                  refresh,
                  user,
                })
              }
              size="icon"
              type="button"
              variant="ghost"
            >
              {user.status === "active" ? (
                <LockKeyhole className="size-4" />
              ) : (
                <UnlockKeyhole className="size-4" />
              )}
            </Button>
          </div>
        )}
        renderToolbarActions={({ refresh }) => (
          <Button
            disabled={isCreatingUser}
            onClick={() => {
              handleOpenCreateUser(refresh);
            }}
            type="button"
          >
            <Plus className="size-4" />
            Thêm người dùng
          </Button>
        )}
        searchPlaceholder="Tìm theo tên, email hoặc ID..."
        title="Danh sách người dùng"
      />

      <UserCreateDrawer
        fetchRoles={fetchRoles}
        isSubmitting={isCreatingUser}
        onOpenChange={setIsCreateDrawerOpen}
        onSubmit={handleCreateUser}
        open={isCreateDrawerOpen}
      />
      <UserDetailDrawer
        fetchRoles={fetchRoles}
        isSubmitting={isUpdatingUser}
        onOpenChange={(open) => !open && setDetailUser(null)}
        onSubmit={handleUpdateUser}
        user={detailUser}
      />
      <UserActionDialog
        action={pendingAction}
        lockUser={lockUser}
        onOpenChange={(open) => !open && setPendingAction(null)}
        unlockUser={unlockUser}
      />
    </div>
  );
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
