"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { ApiResult } from "@/services/api-error";

import { FormDrawer } from "@/components/forms/form-drawer";
import { TextField } from "@/components/forms/text-field";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Button } from "@/components/ui/button";
import {
  updateAdminUserSchema,
  type UpdateAdminUserFormValues,
} from "@/lib/validations/admin-users";
import type {
  AdminRoleOption,
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
  fetchRoles: () => Promise<ApiResult<AdminRoleOption[]>>;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, request: UpdateAdminUserRequest) => Promise<void>;
  user: AdminUserRow | null;
};

export function UserDetailDrawer({
  fetchRoles,
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
          key={user.id}
          onAvatarUploadingChange={setIsUploadingAvatar}
          fetchRoles={fetchRoles}
          onSubmit={onSubmit}
          user={user}
        />
      ) : null}
    </FormDrawer>
  );
}

function UserUpdateForm({
  fetchRoles,
  isAvatarUploading,
  isSubmitting,
  onAvatarUploadingChange,
  onSubmit,
  user,
}: {
  fetchRoles: () => Promise<ApiResult<AdminRoleOption[]>>;
  isAvatarUploading: boolean;
  isSubmitting: boolean;
  onAvatarUploadingChange: (isUploading: boolean) => void;
  onSubmit: (id: string, request: UpdateAdminUserRequest) => Promise<void>;
  user: AdminUserRow;
}) {
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(
    user.avatarUrl ?? "",
  );
  const [avatarMediaId, setAvatarMediaId] = useState(
    user.avatarMediaId ?? "",
  );
  const [roles, setRoles] = useState<AdminRoleOption[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const roleOptions = useMemo(
    () => {
      const options = roles
        .filter((role) => isUuid(role.id) && role.name)
        .map((role) => ({
          label: role.name ?? role.id,
          value: role.id,
        }));

      return options;
    },
    [roles],
  );
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateAdminUserFormValues>({
    defaultValues: {
      citizenId: user.citizenId ?? "",
      dateOfBirth: toDateInputValue(user.dateOfBirth),
      email: user.email,
      fullName: user.name,
      isActive: user.status,
      phoneNumber: user.phone ?? "",
    },
    resolver: zodResolver(updateAdminUserSchema),
  });

  useEffect(() => {
    let isMounted = true;

    async function loadRoles() {
      setIsLoadingRoles(true);

      try {
        const nextRoles = await fetchRoles();

        if (!isMounted) {
          return;
        }

        if (!nextRoles.success) {
          toast.error(nextRoles.error.message);
          return;
        }
        setRoles(nextRoles.data);
        setSelectedRoleId(
          getMatchedRoleId(user, nextRoles.data) || nextRoles.data[0]?.id || "",
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách vai trò.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    }

    void loadRoles();

    return () => {
      isMounted = false;
    };
  }, [fetchRoles, user]);

  async function submitForm(values: UpdateAdminUserFormValues) {
    const normalizedAvatarMediaId = normalizeUuid(avatarMediaId);
    const roleIds = normalizeRoleIds(selectedRoleId);

    const request: UpdateAdminUserRequest = {
      avatarMediaId: normalizedAvatarMediaId,
      citizenId: normalizeNullableText(values.citizenId),
      dateOfBirth: normalizeNullableText(values.dateOfBirth),
      email: normalizeNullableText(values.email),
      fullName: values.fullName.trim(),
      isActive: values.isActive === "active",
      phoneNumber: normalizeNullableText(values.phoneNumber),
      removeAvatar: false,
    };

    if (roleIds) {
      request.roleIds = roleIds;
    }

    await onSubmit(user.id, request);
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
              setAvatarMediaId(mediaId);
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
          error={errors.fullName?.message}
          label="Họ tên"
          {...register("fullName")}
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
          error={errors.phoneNumber?.message}
          label="Số điện thoại"
          {...register("phoneNumber")}
        />
        <TextField
          disabled={disabled}
          error={errors.dateOfBirth?.message}
          label="Ngày sinh"
          type="date"
          {...register("dateOfBirth")}
        />
        <TextField
          disabled={disabled}
          error={errors.citizenId?.message}
          inputMode="numeric"
          label="CCCD/CMND"
          {...register("citizenId")}
        />
        <SelectField
          disabled={disabled || isLoadingRoles}
          label="Vai trò"
          options={roleOptions}
          onChange={(event) => setSelectedRoleId(event.target.value)}
          value={selectedRoleId}
        />
        <SelectField
          disabled={disabled}
          error={errors.isActive?.message}
          label="Trạng thái"
          options={STATUS_OPTIONS}
          {...register("isActive")}
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
          "flex h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-base font-semibold text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 md:text-sm",
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

function getMatchedRoleId(user: AdminUserRow, roles: AdminRoleOption[]) {
  const userRoleNames = new Set(
    (user.globalRoles ?? []).map((roleName) => roleName.toLowerCase()),
  );

  return (
    roles.find(
      (role) =>
        isUuid(role.id) &&
        role.name &&
        userRoleNames.has(role.name.toLowerCase()),
    )?.id ?? ""
  );
}

function isUuid(value?: string | null): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

function normalizeUuid(value?: string | null) {
  return isUuid(value) ? value : null;
}

function normalizeRoleIds(value?: string | null) {
  return isUuid(value) ? [value] : undefined;
}

function normalizeNullableText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.split("T")[0] ?? "";
}
