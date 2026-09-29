"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormDrawer } from "@/components/forms/form-drawer";
import { TextField } from "@/components/forms/text-field";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Button } from "@/components/ui/button";
import {
  ADMIN_USER_ROLE_OPTIONS,
  createAdminUserSchema,
  type CreateAdminUserFormValues,
} from "@/lib/validations/admin-users";
import type {
  AdminUserStatus,
  CreateAdminUserRequest,
} from "@/types/admin-users";
import { cn } from "@/utils/cn";

const CREATE_USER_FORM_ID = "admin-create-user-form";

const STATUS_OPTIONS: Array<{
  label: string;
  value: AdminUserStatus;
}> = [
  { label: "Hoạt động", value: "active" },
  { label: "Tạm khóa", value: "locked" },
];

type UserCreateDrawerProps = {
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: CreateAdminUserRequest) => Promise<void>;
  open: boolean;
};

export function UserCreateDrawer({
  isSubmitting = false,
  onOpenChange,
  onSubmit,
  open,
}: UserCreateDrawerProps) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  return (
    <FormDrawer
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
            form={CREATE_USER_FORM_ID}
            type="submit"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {isSubmitting ? "Đang tạo..." : "Tạo người dùng"}
          </Button>
        </div>
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Thêm người dùng"
    >
      <CreateUserForm
        isAvatarUploading={isUploadingAvatar}
        isSubmitting={isSubmitting}
        onAvatarUploadingChange={setIsUploadingAvatar}
        onSubmit={onSubmit}
      />
    </FormDrawer>
  );
}

function CreateUserForm({
  isAvatarUploading,
  isSubmitting,
  onAvatarUploadingChange,
  onSubmit,
}: {
  isAvatarUploading: boolean;
  isSubmitting: boolean;
  onAvatarUploadingChange: (isUploading: boolean) => void;
  onSubmit: (request: CreateAdminUserRequest) => Promise<void>;
}) {
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CreateAdminUserFormValues>({
    defaultValues: {
      avatarMediaId: "",
      email: "",
      name: "",
      phone: "",
      role: "Customer",
      status: "active",
    },
    resolver: zodResolver(createAdminUserSchema),
  });

  async function submitForm(values: CreateAdminUserFormValues) {
    await onSubmit({
      ...values,
      avatarMediaId: values.avatarMediaId || undefined,
    });
    reset();
    setAvatarPreviewUrl("");
  }

  const disabled = isSubmitting || isAvatarUploading;

  return (
    <form
      className="grid gap-5"
      id={CREATE_USER_FORM_ID}
      onSubmit={handleSubmit(submitForm)}
    >
      <div className="flex flex-col items-center rounded border border-border bg-muted/40 p-5 text-center">
        <MediaAvatarUpload
          disabled={isSubmitting}
          fallbackText="NU"
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
          options={ADMIN_USER_ROLE_OPTIONS.map((option) => ({
            label: option,
            value: option,
          }))}
          {...register("role")}
        />
        <SelectField
          disabled={disabled}
          error={errors.status?.message}
          label="Trạng thái"
          options={STATUS_OPTIONS}
          {...register("status")}
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
