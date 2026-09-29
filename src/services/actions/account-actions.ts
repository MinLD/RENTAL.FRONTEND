"use server";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { changePasswordSchema } from "@/lib/validations/auth";
import { profileSchema } from "@/lib/validations/profile";
import { getActionResponseErrorMessage } from "@/services/actions/action-utils";
import { serverApi } from "@/services/server-api";

export type UpdateProfileActionState = {
  fieldErrors?: Partial<
    Record<"dateOfBirth" | "fullName" | "phoneNumber", string>
  >;
  message?: string;
  success: boolean;
};

export type ChangePasswordActionState = {
  fieldErrors?: Partial<
    Record<"confirmPassword" | "currentPassword" | "newPassword", string>
  >;
  message?: string;
  success: boolean;
};

export async function updateProfileAction(
  _previousState: UpdateProfileActionState,
  formData: FormData,
): Promise<UpdateProfileActionState> {
  const parsedForm = profileSchema.safeParse({
    dateOfBirth: formData.get("dateOfBirth"),
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    identityNumber: formData.get("identityNumber"),
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!parsedForm.success) {
    const flattenedError = parsedForm.error.flatten();

    return {
      fieldErrors: {
        dateOfBirth: flattenedError.fieldErrors.dateOfBirth?.[0],
        fullName: flattenedError.fieldErrors.fullName?.[0],
        phoneNumber: flattenedError.fieldErrors.phoneNumber?.[0],
      },
      message: "Vui lòng kiểm tra lại thông tin cá nhân.",
      success: false,
    };
  }

  const response = await serverApi(API_ENDPOINTS.backend.currentUser.me, {
    json: {
      avatarMediaId: normalizeNullableFormValue(formData.get("avatarMediaId")),
      dateOfBirth: normalizeNullableText(parsedForm.data.dateOfBirth),
      fullName: parsedForm.data.fullName.trim(),
      phoneNumber: normalizeNullableText(parsedForm.data.phoneNumber),
    },
    method: "PATCH",
  });

  if (!response.ok) {
    return {
      message: await getActionResponseErrorMessage(
        response,
        "Không thể cập nhật thông tin cá nhân.",
      ),
      success: false,
    };
  }

  return {
    message: "Cập nhật thông tin cá nhân thành công.",
    success: true,
  };
}

export async function changePasswordAction(
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

  const response = await serverApi(
    API_ENDPOINTS.backend.currentUser.changePassword,
    {
      json: {
        confirmPassword: parsedForm.data.confirmPassword,
        currentPassword: parsedForm.data.currentPassword,
        newPassword: parsedForm.data.newPassword,
      },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    return {
      message: await getActionResponseErrorMessage(
        response,
        "Không thể đổi mật khẩu. Vui lòng thử lại.",
      ),
      success: false,
    };
  }

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
