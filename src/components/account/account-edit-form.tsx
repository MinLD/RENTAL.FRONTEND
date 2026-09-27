"use client";

import {
  CalendarDays,
  IdCard,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { AccountProfileInitialData } from "@/components/account/account-types";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import {
  updateProfileAction,
  type UpdateProfileActionState,
} from "@/services/actions/account-actions";

type AccountEditFormProps = {
  initialProfile: AccountProfileInitialData;
};

const initialUpdateProfileActionState: UpdateProfileActionState = {
  success: false,
};

export function AccountEditForm({ initialProfile }: AccountEditFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialUpdateProfileActionState,
  );

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.success) {
      toast.success(state.message);
      router.refresh();

      return;
    }

    toast.error(state.message);
  }, [router, state]);

  function handleCancel() {
    formRef.current?.reset();
    setFormKey((currentKey) => currentKey + 1);
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

      <form action={formAction} className="mt-6" key={formKey} ref={formRef}>
        <input
          name="avatarUrl"
          type="hidden"
          value={initialProfile.avatarUrl ?? ""}
        />

        {state.message && !state.success ? (
          <p className="mb-4 rounded border border-error/20 bg-error/10 px-3 py-2 text-sm font-medium text-error">
            {state.message}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            autoComplete="name"
            defaultValue={initialProfile.fullName}
            error={state.fieldErrors?.fullName}
            id="fullName"
            label="Họ và tên"
            leftIcon={<UserRound size={16} />}
            name="fullName"
            placeholder="Chưa cập nhật"
          />

          <TextField
            autoComplete="email"
            className="bg-muted text-muted-foreground"
            defaultValue={initialProfile.email}
            id="email"
            label="Email"
            leftIcon={<Mail size={16} />}
            name="email"
            placeholder="Chưa cập nhật"
            readOnly
            type="email"
          />

          <TextField
            autoComplete="tel"
            defaultValue={initialProfile.phoneNumber}
            error={state.fieldErrors?.phoneNumber}
            id="phoneNumber"
            label="Số điện thoại"
            leftIcon={<Phone size={16} />}
            name="phoneNumber"
            placeholder="Chưa cập nhật"
          />

          <TextField
            defaultValue={initialProfile.dateOfBirth}
            error={state.fieldErrors?.dateOfBirth}
            id="dateOfBirth"
            label="Ngày sinh"
            leftIcon={<CalendarDays size={16} />}
            name="dateOfBirth"
            placeholder="Chưa cập nhật"
            type="date"
          />

          <TextField
            className="bg-muted text-muted-foreground"
            defaultValue={initialProfile.identityNumber}
            id="identityNumber"
            label="CCCD/CMND"
            leftIcon={<IdCard size={16} />}
            name="identityNumber"
            placeholder="Chưa cập nhật"
            readOnly
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            disabled={isPending}
            onClick={handleCancel}
            type="button"
            variant="secondary"
          >
            Hủy
          </Button>
          <Button disabled={isPending} type="submit">
            <Save size={16} />
            {isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </form>
    </section>
  );
}
