"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Camera, IdCard, Phone, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getUserInitials } from "@/components/account/account-utils";
import { TextField } from "@/components/forms/text-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  completeProfileSchema,
  type CompleteProfileFormValues,
} from "@/lib/validations/profile";
import { completeCurrentUserProfile } from "@/services/account-service";
import { refreshSession } from "@/services/auth-service";
import type { AuthUser } from "@/types/auth";

type CompleteProfileFormProps = {
  user: AuthUser;
};

export function CompleteProfileForm({ user }: CompleteProfileFormProps) {
  const router = useRouter();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CompleteProfileFormValues>({
    defaultValues: {
      citizenId: "",
      dateOfBirth: toDateInputValue(user.dateOfBirth),
      fullName: user.name === "Người dùng" ? "" : user.name,
      phoneNumber: user.phoneNumber ?? "",
    },
    resolver: zodResolver(completeProfileSchema),
  });

  async function onSubmit(values: CompleteProfileFormValues) {
    try {
      await completeCurrentUserProfile({
        avatarUrl: user.avatarUrl ?? null,
        citizenId: values.citizenId.trim(),
        dateOfBirth: values.dateOfBirth,
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber.trim(),
      });
      await refreshSession();

      toast.success("Hoàn thiện hồ sơ thành công.");
      router.replace("/account");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể hoàn thiện hồ sơ. Vui lòng thử lại.",
      );
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="self-start rounded-lg border border-border bg-background p-6 shadow-sm lg:sticky lg:top-6">
        <h1 className="text-xl font-bold text-foreground">
          Hồ sơ chưa hoàn thiện
        </h1>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Các trường định danh giúp xác thực hợp đồng và giảm rủi ro giao dịch.
        </p>

        <div className="mt-10 space-y-8">
          <ProfileStatusItem
            colorClassName="bg-error"
            label="CCCD/CMND"
            status="Chưa cập nhật"
          />
          <ProfileStatusItem
            colorClassName="bg-primary"
            label="Số điện thoại"
            status="Chưa xác nhận"
          />
          <ProfileStatusItem
            colorClassName="bg-primary"
            label="Trạng thái"
            status="Đợi hoàn thiện"
          />
        </div>
      </aside>

      <section className="rounded-lg border border-border bg-background p-6 shadow-sm md:p-8">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Thông tin định danh
          </h2>
        </div>

        <form
          className="mt-8 flex min-h-[430px] flex-col"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              autoComplete="name"
              error={errors.fullName?.message}
              id="complete-fullName"
              label="Họ và tên"
              leftIcon={<UserRound size={16} />}
              placeholder="Nhập họ và tên"
              {...register("fullName")}
            />

            <TextField
              autoComplete="tel"
              error={errors.phoneNumber?.message}
              id="complete-phoneNumber"
              label="Số điện thoại"
              leftIcon={<Phone size={16} />}
              placeholder="Nhập số điện thoại"
              {...register("phoneNumber")}
            />

            <TextField
              error={errors.dateOfBirth?.message}
              id="complete-dateOfBirth"
              label="Ngày sinh"
              leftIcon={<CalendarDays size={16} />}
              type="date"
              {...register("dateOfBirth")}
            />

            <TextField
              error={errors.citizenId?.message}
              id="complete-citizenId"
              inputMode="numeric"
              label="CCCD/CMND"
              leftIcon={<IdCard size={16} />}
              placeholder="Nhập số CCCD/CMND"
              {...register("citizenId")}
            />
          </div>

          <div className="mt-8 flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20 bg-secondary text-secondary-foreground">
                {user.avatarUrl ? (
                  <AvatarImage alt={user.name} src={user.avatarUrl} />
                ) : null}
                <AvatarFallback className="bg-secondary text-xl font-bold text-secondary-foreground">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <button
                aria-label="Cập nhật ảnh đại diện"
                className="absolute bottom-0 right-0 inline-flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
                type="button"
              >
                <Camera size={14} />
              </button>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Ảnh đại diện</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Bấm biểu tượng camera để tải ảnh từ thiết bị.
              </p>
            </div>
          </div>

          <div className="mt-auto flex justify-end gap-3 pt-8">
            <Button
              onClick={() =>
                toast.info("Tính năng lưu nháp đang được phát triển.")
              }
              type="button"
              variant="secondary"
            >
              Lưu nháp
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Đang lưu..." : "Hoàn thiện"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProfileStatusItem({
  colorClassName,
  label,
  status,
}: {
  colorClassName: string;
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className={`mt-1 size-4 rounded-full ${colorClassName}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-bold text-error">{status}</p>
      </div>
    </div>
  );
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.split("T")[0] ?? "";
}
