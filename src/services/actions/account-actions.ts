"use server";

import { refresh } from "next/cache";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { changePasswordSchema } from "@/lib/validations/auth";
import { profileSchema } from "@/lib/validations/profile";
import type { ApiErrorDetails } from "@/services/api-error";
import { serverApiOk, serverApiResult } from "@/services/server-api";
import type { ChangePasswordRequest, UpdateProfileRequest } from "@/types/auth";

export type UpdateProfileActionState = {
  error?: ApiErrorDetails;
  fieldErrors?: Partial<
    Record<
      "dateOfBirth" | "fullName" | "identityNumber" | "phoneNumber",
      string
    >
  >;
  message?: string;
  success: boolean;
};

export type ChangePasswordActionState = {
  error?: ApiErrorDetails;
  fieldErrors?: Partial<
    Record<"confirmPassword" | "currentPassword" | "newPassword", string>
  >;
  message?: string;
  success: boolean;
};

export async function updateProfileAction(
  previousState: UpdateProfileActionState,
  formData: FormData,
): Promise<UpdateProfileActionState> {
  const result = await serverApiResult(() =>
    updateProfile(previousState, formData),
  );

  return result.success
    ? result.data
    : { success: false, error: result.error, message: result.error.message };
}

async function updateProfile(
  _previousState: UpdateProfileActionState,
  formData: FormData,
): Promise<UpdateProfileActionState> {
  const parsedForm = profileSchema.safeParse({
    dateOfBirth: formData.get("dateOfBirth"),
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    identityNumber: normalizeMaskedIdentityNumber(
      formData.get("identityNumber"),
    ),
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!parsedForm.success) {
    const flattenedError = parsedForm.error.flatten();

    return {
      fieldErrors: {
        dateOfBirth: flattenedError.fieldErrors.dateOfBirth?.[0],
        fullName: flattenedError.fieldErrors.fullName?.[0],
        identityNumber: flattenedError.fieldErrors.identityNumber?.[0],
        phoneNumber: flattenedError.fieldErrors.phoneNumber?.[0],
      },
      message: "Vui lòng kiểm tra lại thông tin cá nhân.",
      success: false,
    };
  }

  const request: UpdateProfileRequest = {
    avatarMediaId: normalizeNullableFormValue(formData.get("avatarMediaId")),
    citizenId: normalizeNullableText(parsedForm.data.identityNumber),
    dateOfBirth: normalizeNullableText(parsedForm.data.dateOfBirth),
    fullName: parsedForm.data.fullName.trim(),
    phoneNumber: normalizeNullableText(parsedForm.data.phoneNumber),
    removeAvatar: false,
  };

  await serverApiOk(
    API_ENDPOINTS.backend.currentUser.profile,
    "Không thể cập nhật thông tin cá nhân.",
    { json: request, method: "PUT" },
  );

  refresh();
  return {
    message: "Cập nhật thông tin cá nhân thành công.",
    success: true,
  };
}

export async function changePasswordAction(
  previousState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const result = await serverApiResult(() =>
    changePassword(previousState, formData),
  );

  return result.success
    ? result.data
    : { success: false, error: result.error, message: result.error.message };
}

async function changePassword(
  _previousState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const parsedForm = changePasswordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsedForm.success) {
    const flattenedError = parsedForm.error.flatten();

    return {
      fieldErrors: {
        confirmPassword: flattenedError.fieldErrors.confirmPassword?.[0],
        currentPassword: flattenedError.fieldErrors.currentPassword?.[0],
        newPassword: flattenedError.fieldErrors.newPassword?.[0],
      },
      message: "Vui lòng kiểm tra lại thông tin đổi mật khẩu.",
      success: false,
    };
  }

  const request: ChangePasswordRequest = {
    newPassword: parsedForm.data.newPassword,
    oldPassword: parsedForm.data.currentPassword,
  };

  await serverApiOk(
    API_ENDPOINTS.backend.currentUser.changePassword,
    "Không thể đổi mật khẩu. Vui lòng thử lại.",
    {
      json: request,
      method: "POST",
    },
  );

  return {
    message: "Đổi mật khẩu thành công.",
    success: true,
  };
}

function normalizeNullableFormValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? normalizeNullableText(value) : null;
}

function normalizeNullableText(value?: string) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

function normalizeMaskedIdentityNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return value;
  }

  return value.includes("*") ? "" : value;
}
