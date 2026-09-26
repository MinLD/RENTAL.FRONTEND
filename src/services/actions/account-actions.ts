"use server";

import { changePasswordSchema } from "@/lib/validations/auth";
import { serverApi } from "@/services/server-api";

const CHANGE_PASSWORD_ENDPOINT = "/api/v1/auth/users/me/password";

export type ChangePasswordActionState = {
  fieldErrors?: Partial<
    Record<"confirmPassword" | "currentPassword" | "newPassword", string>
  >;
  message?: string;
  success: boolean;
};

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

  const response = await serverApi(CHANGE_PASSWORD_ENDPOINT, {
    json: {
      confirmPassword: parsedForm.data.confirmPassword,
      currentPassword: parsedForm.data.currentPassword,
      newPassword: parsedForm.data.newPassword,
    },
    method: "PATCH",
  });

  if (!response.ok) {
    return {
      message: await getResponseErrorMessage(
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

async function getResponseErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  let responseBody: unknown;

  try {
    responseBody = await response.clone().json();
  } catch {
    return fallbackMessage;
  }

  return (
    getValidationErrorMessage(responseBody) ??
    getProblemDetailMessage(responseBody) ??
    fallbackMessage
  );
}

function getValidationErrorMessage(responseBody: unknown) {
  if (
    !responseBody ||
    typeof responseBody !== "object" ||
    !("errors" in responseBody) ||
    !responseBody.errors ||
    typeof responseBody.errors !== "object"
  ) {
    return null;
  }

  const messages = Object.values(responseBody.errors).flatMap((value) => {
    if (Array.isArray(value)) {
      return value.filter(
        (message): message is string => typeof message === "string",
      );
    }

    return typeof value === "string" ? [value] : [];
  });

  return messages.length ? messages.join("\n") : null;
}

function getProblemDetailMessage(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== "object") {
    return null;
  }

  if (
    "detail" in responseBody &&
    typeof responseBody.detail === "string" &&
    responseBody.detail
  ) {
    return responseBody.detail;
  }

  if (
    "title" in responseBody &&
    typeof responseBody.title === "string" &&
    responseBody.title
  ) {
    return responseBody.title;
  }

  if (
    "message" in responseBody &&
    typeof responseBody.message === "string" &&
    responseBody.message
  ) {
    return responseBody.message;
  }

  return null;
}
