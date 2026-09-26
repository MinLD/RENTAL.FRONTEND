"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  IdCard,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { AccountProfileInitialData } from "@/components/account/account-types";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/lib/validations/profile";
import { updateCurrentUserProfile } from "@/services/account-service";

type AccountEditFormProps = {
  initialProfile: AccountProfileInitialData;
};

export function AccountEditForm({ initialProfile }: AccountEditFormProps) {
  const router = useRouter();
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ProfileFormValues>({
    defaultValues: {
      dateOfBirth: initialProfile.dateOfBirth,
      email: initialProfile.email,
      fullName: initialProfile.fullName,
      identityNumber: initialProfile.identityNumber,
      phoneNumber: initialProfile.phoneNumber,
    },
    resolver: zodResolver(profileSchema),
  });

  async function onSubmit(values: ProfileFormValues) {
    try {
      await updateCurrentUserProfile({
        avatarUrl: initialProfile.avatarUrl || null,
        dateOfBirth: normalizeNullableText(values.dateOfBirth),
        fullName: values.fullName.trim(),
        phoneNumber: normalizeNullableText(values.phoneNumber),
      });

      console.log("Updated account profile form values:", values);
      toast.success("Cập nhật thông tin cá nhân thành công.");
      reset(values);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật thông tin cá nhân.",
      );
    }
  }

  function handleCancel() {
    reset();
  }

  return (
    <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Thông tin cá nhân
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cập nhật các trường có thể chỉnh sửa trong hồ sơ người dùng.
        </p>
      </div>

      <form className="mt-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            autoComplete="name"
            error={errors.fullName?.message}
            id="fullName"
            label="Họ và tên"
            leftIcon={<UserRound size={16} />}
            placeholder="Chưa cập nhật"
            {...register("fullName")}
          />

          <TextField
            autoComplete="email"
            className="bg-muted text-muted-foreground"
            error={errors.email?.message}
            id="email"
            label="Email"
            leftIcon={<Mail size={16} />}
            placeholder="Chưa cập nhật"
            readOnly
            type="email"
            {...register("email")}
          />

          <TextField
            autoComplete="tel"
            error={errors.phoneNumber?.message}
            id="phoneNumber"
            label="Số điện thoại"
            leftIcon={<Phone size={16} />}
            placeholder="Chưa cập nhật"
            {...register("phoneNumber")}
          />

          <TextField
            error={errors.dateOfBirth?.message}
            id="dateOfBirth"
            label="Ngày sinh"
            leftIcon={<CalendarDays size={16} />}
            placeholder="Chưa cập nhật"
            type="date"
            {...register("dateOfBirth")}
          />

          <TextField
            className="bg-muted text-muted-foreground"
            error={errors.identityNumber?.message}
            id="identityNumber"
            label="CCCD/CMND"
            leftIcon={<IdCard size={16} />}
            placeholder="Chưa cập nhật"
            readOnly
            {...register("identityNumber")}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            disabled={!isDirty || isSubmitting}
            onClick={handleCancel}
            type="button"
            variant="secondary"
          >
            Hủy
          </Button>
          <Button disabled={isSubmitting} type="submit">
            <Save size={16} />
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function normalizeNullableText(value?: string) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}
