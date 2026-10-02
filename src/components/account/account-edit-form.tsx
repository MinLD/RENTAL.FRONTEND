"use client";

import {
  CalendarDays,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { toast } from "sonner";

import {
  ACCOUNT_PROFILE_UPDATED_EVENT,
  type AccountProfileUpdatedEventDetail,
} from "@/components/account/account-profile-events";
import type { AccountProfileInitialData } from "@/components/account/account-types";
import { AccountCitizenIdField } from "@/components/account/account-citizen-id-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import {
  updateProfileAction,
  type UpdateProfileActionState,
} from "@/services/actions/account-actions";

type AccountEditFormProps = {
  avatarMediaId?: string;
  avatarPreviewUrl?: string;
  initialProfile: AccountProfileInitialData;
  isAvatarDirty?: boolean;
  isAvatarUploading?: boolean;
  onCancel?: () => void;
  onSavingChange?: (isSaving: boolean) => void;
  userId: string;
};

const initialUpdateProfileActionState: UpdateProfileActionState = {
  success: false,
};

export function AccountEditForm({
  avatarMediaId,
  avatarPreviewUrl,
  initialProfile,
  isAvatarDirty = false,
  isAvatarUploading = false,
  onCancel,
  onSavingChange,
  userId,
}: AccountEditFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [isFieldsDirty, setIsFieldsDirty] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialUpdateProfileActionState,
  );
  const isDirty = isFieldsDirty || isAvatarDirty;
  const isBusy = isPending || isAvatarUploading;
  const submissionInProgress = useRef(false);
  const handledActionState = useRef(initialUpdateProfileActionState);

  useEffect(() => {
    if (!state.message || handledActionState.current === state) {
      return;
    }
    handledActionState.current = state;
    submissionInProgress.current = false;
    onSavingChange?.(false);

    if (state.success) {
      toast.success(state.message);
      const nextAvatarUrl = avatarPreviewUrl ?? initialProfile.avatarUrl ?? "";

      if (nextAvatarUrl) {
        window.dispatchEvent(
          new CustomEvent<AccountProfileUpdatedEventDetail>(
            ACCOUNT_PROFILE_UPDATED_EVENT,
            {
              detail: {
                avatarUrl: nextAvatarUrl,
                userId,
              },
            },
          ),
        );
      }

      router.refresh();

      return;
    }

    toast.error(state.message);
  }, [avatarPreviewUrl, initialProfile.avatarUrl, onSavingChange, router, state, userId]);

  function handleCancel() {
    if (isBusy || submissionInProgress.current) return;
    formRef.current?.reset();
    setIsFieldsDirty(false);
    onCancel?.();
    setFormKey((currentKey) => currentKey + 1);
  }

  function handleFormAction(formData: FormData) {
    if (!isDirty || isBusy || submissionInProgress.current) return;
    submissionInProgress.current = true;
    setIsFieldsDirty(false);
    formAction(formData);
  }

  function handleFormChange(event: FormEvent<HTMLFormElement>) {
    // The CCCD field reports its next draft directly, before its hidden input updates.
    if ((event.target as HTMLElement).id === "identityNumber") return;
    updateDirtyState();
  }

  function updateDirtyState(identityNumber?: string) {
    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);

    setIsFieldsDirty(
      getTextValue(formData, "fullName") !== initialProfile.fullName ||
        getTextValue(formData, "phoneNumber") !== initialProfile.phoneNumber ||
        getTextValue(formData, "dateOfBirth") !== initialProfile.dateOfBirth ||
        normalizeIdentityNumberValue(
          identityNumber ?? getTextValue(formData, "identityNumber"),
        ) !==
          normalizeIdentityNumberValue(initialProfile.identityNumber),
    );
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

      <form
        action={handleFormAction}
        className="mt-6"
        key={formKey}
        onChange={handleFormChange}
        onInput={handleFormChange}
        onSubmit={(event) => {
          if (!isDirty || isBusy || submissionInProgress.current) {
            event.preventDefault();
          } else {
            // Lock avatar selection before the form action starts its transition.
            onSavingChange?.(true);
          }
        }}
        ref={formRef}
      >
        <input
          name="avatarMediaId"
          type="hidden"
          value={avatarMediaId ?? initialProfile.avatarMediaId ?? ""}
        />
        <input name="removeAvatar" type="hidden" value="false" />

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

          <AccountCitizenIdField
            disabled={isPending}
            error={state.fieldErrors?.identityNumber}
            initialValue={initialProfile.identityNumber ?? ""}
            key={`${userId}:${initialProfile.identityNumber ?? ""}`}
            onValueChange={updateDirtyState}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            disabled={!isDirty || isBusy}
            onClick={handleCancel}
            type="button"
            variant="secondary"
          >
            Hủy
          </Button>
          <Button disabled={!isDirty || isBusy} type="submit">
            <Save size={16} />
            {isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function getTextValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function normalizeIdentityNumberValue(value?: string) {
  const normalizedValue = value?.trim() ?? "";

  return normalizedValue.includes("*") ? "" : normalizedValue;
}
