"use client";

import { CalendarDays, Info, Mail, Phone, Save, UserRound } from "lucide-react";
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
import { FULL_NAME_MAX_LENGTH } from "@/config/profile";
import { profileSchema } from "@/lib/validations/profile";
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

type AccountFieldErrors = NonNullable<UpdateProfileActionState["fieldErrors"]>;

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
  const [clientFieldErrors, setClientFieldErrors] =
    useState<AccountFieldErrors>({});
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialUpdateProfileActionState,
  );
  const isDirty = isFieldsDirty || isAvatarDirty;
  const isBusy = isPending || isAvatarUploading;
  const hasClientFieldErrors = Object.values(clientFieldErrors).some(Boolean);
  const displayedFieldErrors =
    isFieldsDirty || hasClientFieldErrors
      ? clientFieldErrors
      : (state.fieldErrors ?? {});
  const submissionInProgress = useRef(false);
  const handledActionState = useRef(initialUpdateProfileActionState);
  const missingProfileFields = [
    ...(!initialProfile.identityNumber?.trim() ? ["CCCD/CMND"] : []),
    ...(!initialProfile.dateOfBirth?.trim() ? ["ngày sinh"] : []),
    ...(!initialProfile.phoneNumber?.trim() ? ["SDT"] : []),
  ];

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
  }, [
    avatarPreviewUrl,
    initialProfile.avatarUrl,
    onSavingChange,
    router,
    state,
    userId,
  ]);

  function handleCancel() {
    if (isBusy || submissionInProgress.current) return;
    formRef.current?.reset();
    setIsFieldsDirty(false);
    setClientFieldErrors({});
    onCancel?.();
    setFormKey((currentKey) => currentKey + 1);
  }

  function handleFormAction(formData: FormData) {
    if (!isDirty || isBusy || submissionInProgress.current) return;
    if (!validateProfileForm(formData)) {
      onSavingChange?.(false);
      return;
    }
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
        ) !== normalizeIdentityNumberValue(initialProfile.identityNumber),
    );
    validateProfileForm(formData, identityNumber);
  }

  function validateProfileForm(formData: FormData, identityNumber?: string) {
    const parsedForm = profileSchema.safeParse({
      dateOfBirth: formData.get("dateOfBirth"),
      email: formData.get("email"),
      fullName: formData.get("fullName"),
      identityNumber: normalizeMaskedIdentityNumberValue(
        identityNumber ?? getTextValue(formData, "identityNumber"),
      ),
      phoneNumber: formData.get("phoneNumber"),
    });

    if (parsedForm.success) {
      setClientFieldErrors({});
      return true;
    }

    const flattenedError = parsedForm.error.flatten();

    setClientFieldErrors({
      dateOfBirth: flattenedError.fieldErrors.dateOfBirth?.[0],
      fullName: flattenedError.fieldErrors.fullName?.[0],
      identityNumber: flattenedError.fieldErrors.identityNumber?.[0],
      phoneNumber: flattenedError.fieldErrors.phoneNumber?.[0],
    });

    return false;
  }

  return (
    <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
      <div>
        <h1 className="text-xl font-bold text-foreground">Thông tin cá nhân</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cập nhật các trường có thể chỉnh sửa trong hồ sơ người dùng.
        </p>
      </div>

      {missingProfileFields.length > 0 ? (
        <div
          aria-label="Lưu ý hoàn thiện thông tin"
          className="mt-2 flex items-start gap-2  py-2.5 text-xs leading-5 text-primary"
          role="note"
        >
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <p>
            Để thuê thiết bị hoặc đăng ký tổ chức, vui lòng bổ sung{" "}
            <strong className="font-semibold">
              {missingProfileFields.join(" và ")}
            </strong>{" "}
            và lưu thông tin.
          </p>
        </div>
      ) : null}

      <form
        action={handleFormAction}
        className="mt-6"
        key={formKey}
        onChange={handleFormChange}
        onInput={handleFormChange}
        onSubmit={(event) => {
          if (
            !isDirty ||
            isBusy ||
            hasClientFieldErrors ||
            submissionInProgress.current
          ) {
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
            error={displayedFieldErrors.fullName}
            id="fullName"
            label="Họ và tên"
            leftIcon={<UserRound size={16} />}
            maxLength={FULL_NAME_MAX_LENGTH}
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
            error={displayedFieldErrors.phoneNumber}
            id="phoneNumber"
            label="Số điện thoại"
            leftIcon={<Phone size={16} />}
            name="phoneNumber"
            placeholder="Chưa cập nhật"
          />

          <TextField
            defaultValue={initialProfile.dateOfBirth}
            error={displayedFieldErrors.dateOfBirth}
            id="dateOfBirth"
            label="Ngày sinh"
            leftIcon={<CalendarDays size={16} />}
            name="dateOfBirth"
            placeholder="Chưa cập nhật"
            type="date"
          />

          <AccountCitizenIdField
            disabled={isPending}
            error={displayedFieldErrors.identityNumber}
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
          <Button
            disabled={!isDirty || isBusy || hasClientFieldErrors}
            type="submit"
          >
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

function normalizeMaskedIdentityNumberValue(value?: string) {
  return normalizeIdentityNumberValue(value);
}
