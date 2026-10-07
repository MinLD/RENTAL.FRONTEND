import { unstable_rethrow } from "next/navigation";

import { ApiInputError, getApiFieldErrors } from "@/services/api-error";
import { ServerApiError } from "@/services/server-api";
import type { ActionResult } from "@/types/action-result";

export async function runServerAction<T>(
  action: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { success: true, data: await action() };
  } catch (error) {
    // Redirects and other Next.js control flow must reach the framework.
    unstable_rethrow(error);

    if (error instanceof ServerApiError && error.status < 500) {
      return {
        success: false,
        error: {
          fieldErrors: getApiFieldErrors(error.responseBody),
          message: error.message,
          status: error.status,
        },
      };
    }

    if (error instanceof ApiInputError) {
      return {
        success: false,
        error: {
          fieldErrors: error.fieldErrors,
          message: error.message,
          status: 400,
        },
      };
    }

    console.error("Server Action failed:", error);

    return {
      success: false,
      error: {
        fieldErrors: {},
        message: "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.",
        status: error instanceof ServerApiError ? error.status : 500,
      },
    };
  }
}
