"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormDrawer } from "@/components/forms/form-drawer";
import { TextField } from "@/components/forms/text-field";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Button } from "@/components/ui/button";
import {
  ADMIN_USER_ROLE_OPTIONS,
  updateAdminUserSchema,
  type UpdateAdminUserFormValues,
} from "@/lib/validations/admin-users";
import type {
  AdminUserRow,
  AdminUserStatus,
  UpdateAdminUserRequest,
} from "@/types/admin-users";
import { cn } from "@/utils/cn";

import { getInitials } from "./users-table-utils";

const USER_DETAIL_FORM_ID = "admin-user-detail-form";

const STATUS_OPTIONS: Array<{
  label: string;
  value: AdminUserStatus;
}> = [
  { label: "Hoạt động", value: "active" },
  { label: "Tạm khóa", value: "locked" },
];

type UserDetailDrawerProps = {
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, request: UpdateAdminUserRequest) => Promise<void>;
  user: AdminUserRow | null;
};

export function UserDetailDrawer({
  isSubmitting = false,
  onOpenChange,
  onSubmit,
  user,
}: UserDetailDrawerProps) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  return (
    <FormDrawer
      description={user?.email}
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button
            disabled={isSubmitting || isUploadingAvatar}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="secondary"
          >
            Hủy
          </Button>
          <Button
            disabled={isSubmitting || isUploadingAvatar}
            form={USER_DETAIL_FORM_ID}
            type="submit"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      }
      onOpenChange={onOpenChange}
      open={Boolean(user)}
      title={user?.name ?? "Chi tiết người dùng"}
    >
      {user ? (
        <UserUpdateForm
          isAvatarUploading={isUploadingAvatar}
          isSubmitting={isSubmitting}
          key={`${user.id}-${user.email}-${user.avatarMediaId ?? ""}-${user.avatarUrl ?? ""}`}
          onAvatarUploadingChange={setIsUploadingAvatar}
          onSubmit={onSubmit}
          user={user}
        />
      ) : null}
    </FormDrawer>
  );
}

function UserUpdateForm({
  isAvatarUploading,
  isSubmitting,
  onAvatarUploadingChange,
  onSubmit,
  user,
}: {
  isAvatarUploading: boolean;
  isSubmitting: boolean;
  onAvatarUploadingChange: (isUploading: boolean) => void;
  onSubmit: (id: string, request: UpdateAdminUserRequest) => Promise<void>;
  user: AdminUserRow;
}) {
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(
    user.avatarUrl ?? "",
  );
  const roleOptions = getRoleOptions(getUserRole(user));
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<UpdateAdminUserFormValues>({
    defaultValues: {
      avatarMediaId: user.avatarMediaId ?? "",
      email: user.email,
      name: user.name,
      phone: user.phone ?? "",
      role: getUserRole(user),
      status: user.status,
    },
    resolver: zodResolver(updateAdminUserSchema),
  });

  async function submitForm(values: UpdateAdminUserFormValues) {
    await onSubmit(user.id, {
      ...values,
      avatarMediaId: values.avatarMediaId || undefined,
    });
  }

  const disabled = isSubmitting || isAvatarUploading;

  return (
    <form
      className="grid gap-5"
      id={USER_DETAIL_FORM_ID}
      onSubmit={handleSubmit(submitForm)}
    >
      <div className="flex flex-col items-center rounded border border-border bg-muted/40 p-5 text-center">
        <MediaAvatarUpload
          disabled={isSubmitting}
          fallbackText={getInitials(user.name)}
          onChange={(mediaId, upload) => {
            if (typeof mediaId === "string" && !Array.isArray(upload)) {
              setValue("avatarMediaId", mediaId, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setAvatarPreviewUrl(upload.previewUrl);
            }
          }}
          onUploadingChange={onAvatarUploadingChange}
          previewUrl={avatarPreviewUrl}
          size="xl"
        />
        <div className="mt-4 max-w-full">
          <p className="truncate text-sm font-bold text-foreground">
            Ảnh đại diện
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <TextField disabled label="ID" readOnly value={user.id} />
        <TextField
          disabled={disabled}
          error={errors.name?.message}
          label="Họ tên"
          {...register("name")}
        />
        <TextField
          disabled={disabled}
          error={errors.email?.message}
          label="Email"
          type="email"
          {...register("email")}
        />
        <TextField
          disabled={disabled}
          error={errors.phone?.message}
          label="Số điện thoại"
          {...register("phone")}
        />
        <SelectField
          disabled={disabled}
          error={errors.role?.message}
          label="Vai trò"
          options={roleOptions}
          {...register("role")}
        />
        <SelectField
          disabled={disabled}
          error={errors.status?.message}
          label="Trạng thái"
          options={STATUS_OPTIONS}
          {...register("status")}
        />
        <TextField
          disabled
          label="Ngày khởi tạo"
          readOnly
          value={formatDateTime(user.createdAtUtc)}
        />
      </div>
    </form>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  label: string;
  options: Array<{
    label: string;
    value: string;
  }>;
};

function SelectField({
  disabled,
  error,
  label,
  options,
  ...props
}: SelectFieldProps) {
  return (
    <label className="space-y-1.5">
      <span className="block text-xs font-semibold uppercase text-foreground">
        {label}
      </span>
      <select
        aria-invalid={error ? true : undefined}
        className={cn(
          "flex h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60",
          error && "border-error",
        )}
        disabled={disabled}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs font-medium text-error">{error}</p> : null}
    </label>
  );
}

function getUserRole(user: AdminUserRow) {
  return user.role?.trim() || user.globalRoles?.[0] || "User";
}

function getRoleOptions(currentRole: string) {
  const options = new Set<string>(ADMIN_USER_ROLE_OPTIONS);

  if (currentRole) {
    options.add(currentRole);
  }

  return Array.from(options).map((option) => ({
    label: option,
    value: option,
  }));
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
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
