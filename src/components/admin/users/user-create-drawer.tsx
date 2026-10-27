"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { ApiResult } from "@/services/api-error";

import { FormDrawer } from "@/components/forms/form-drawer";
import { PasswordField } from "@/components/forms/password-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import {
  createAdminUserSchema,
  type CreateAdminUserFormValues,
} from "@/lib/validations/admin-users";
import type {
  AdminRoleOption,
  CreateAdminUserRequest,
} from "@/types/admin-users";
import { isOwnerRole } from "@/utils/auth-user";
import { cn } from "@/utils/cn";
const CREATE_USER_FORM_ID = "admin-create-user-form";

type UserCreateDrawerProps = {
  fetchRoles: () => Promise<ApiResult<AdminRoleOption[]>>;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: CreateAdminUserRequest) => Promise<void>;
  open: boolean;
};

export function UserCreateDrawer({
  fetchRoles,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
  open,
}: UserCreateDrawerProps) {
  return (
    <FormDrawer
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="secondary"
          >
            Hủy
          </Button>
          <Button
            disabled={isSubmitting}
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
        fetchRoles={fetchRoles}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        open={open}
      />
    </FormDrawer>
  );
}

function CreateUserForm({
  fetchRoles,
  isSubmitting,
  onSubmit,
  open,
}: {
  fetchRoles: () => Promise<ApiResult<AdminRoleOption[]>>;
  isSubmitting: boolean;
  onSubmit: (request: CreateAdminUserRequest) => Promise<void>;
  open: boolean;
}) {
  const [roles, setRoles] = useState<AdminRoleOption[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const roleOptions = useMemo(
    () => [
      ...roles
        .filter((role) => !isOwnerRole(role.name))
        .map((role) => ({
          label: role.name ?? role.id,
          value: role.id,
        })),
    ],
    [roles],
  );
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CreateAdminUserFormValues>({
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
    },
    resolver: zodResolver(createAdminUserSchema),
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;

    async function loadRoles() {
      setIsLoadingRoles(true);

      try {
        const nextRoles = await fetchRoles();

        if (isMounted) {
          if (!nextRoles.success) {
            toast.error(nextRoles.error.message);
            return;
          }
          setRoles(nextRoles.data);
        }
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
  }, [fetchRoles, open]);

  async function submitForm(values: CreateAdminUserFormValues) {
    const roleIds = normalizeRoleIds(selectedRoleId);
    const request: CreateAdminUserRequest = {
      email: values.email.trim(),
      fullName: values.fullName.trim(),
      password: values.password,
    };

    if (roleIds) {
      request.roleIds = roleIds;
    }

    await onSubmit(request);
    reset();
    setSelectedRoleId("");
  }

  return (
    <form
      className="grid gap-4"
      id={CREATE_USER_FORM_ID}
      onSubmit={handleSubmit(submitForm)}
    >
      <TextField
        disabled={isSubmitting}
        error={errors.fullName?.message}
        label="Họ tên"
        {...register("fullName")}
      />
      <TextField
        disabled={isSubmitting}
        error={errors.email?.message}
        label="Email"
        type="email"
        {...register("email")}
      />
      <PasswordField
        disabled={isSubmitting}
        error={errors.password?.message}
        label="Mật khẩu"
        {...register("password")}
      />
      <SelectField
        disabled={isSubmitting || isLoadingRoles}
        label="Vai trò"
        onChange={(event) => setSelectedRoleId(event.target.value)}
        options={roleOptions}
        value={selectedRoleId}
      />
    </form>
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

function normalizeRoleIds(value?: string | null) {
  return isUuid(value) ? [value] : undefined;
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
