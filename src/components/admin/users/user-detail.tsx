"use client";

import { LoaderCircle, Save } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { FormDrawer } from "@/components/forms/form-drawer";
import { TextField } from "@/components/forms/text-field";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Button } from "@/components/ui/button";
import { uploadMockMediaFile } from "@/services/media-service";
import type {
  AdminUserRow,
  AdminUserStatus,
  UpdateAdminUserRequest,
} from "@/types/admin-users";
import { cn } from "@/utils/cn";

import { getInitials } from "./users-table-utils";

const USER_DETAIL_FORM_ID = "admin-user-detail-form";

const ROLE_OPTIONS = ["Admin", "Customer", "Supplier"] as const;

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
  const [avatarMediaId, setAvatarMediaId] = useState(user.avatarMediaId ?? "");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(
    user.avatarUrl ?? "",
  );
  const [email, setEmail] = useState(user.email);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState(getUserRole(user));
  const [status, setStatus] = useState<AdminUserStatus>(user.status);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit(user.id, {
      avatarMediaId: avatarMediaId || undefined,
      email,
      name,
      phone,
      role,
      status,
    });
  }

  const disabled = isSubmitting || isAvatarUploading;

  return (
    <form
      className="grid gap-5"
      id={USER_DETAIL_FORM_ID}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col items-center rounded border border-border bg-muted/40 p-5 text-center">
        <MediaAvatarUpload
          disabled={isSubmitting}
          fallbackText={getInitials(name)}
          onChange={(mediaId, upload) => {
            if (typeof mediaId === "string" && !Array.isArray(upload)) {
              setAvatarMediaId(mediaId);
              setAvatarPreviewUrl(upload.previewUrl);
            }
          }}
          onUploadingChange={onAvatarUploadingChange}
          previewUrl={avatarPreviewUrl}
          size="xl"
          uploadFile={(file) => uploadMockMediaFile(file)}
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
          label="Họ tên"
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
        <TextField
          disabled={disabled}
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <TextField
          disabled={disabled}
          label="Số điện thoại"
          onChange={(event) => setPhone(event.target.value)}
          value={phone}
        />
        <SelectField
          disabled={disabled}
          label="Vai trò"
          onChange={setRole}
          options={ROLE_OPTIONS.map((option) => ({
            label: option,
            value: option,
          }))}
          value={role}
        />
        <SelectField
          disabled={disabled}
          label="Trạng thái"
          onChange={(value) => setStatus(value as AdminUserStatus)}
          options={STATUS_OPTIONS}
          value={status}
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

function SelectField({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{
    label: string;
    value: string;
  }>;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-xs font-semibold uppercase text-foreground">
        {label}
      </span>
      <select
        className={cn(
          "flex h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60",
        )}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getUserRole(user: AdminUserRow) {
  return user.role?.trim() || user.globalRoles?.[0] || "User";
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
