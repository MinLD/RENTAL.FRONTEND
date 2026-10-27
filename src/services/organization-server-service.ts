import "server-only";

import { cache } from "react";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { organizationResponseSchema } from "@/lib/validations/organization";
import { ApiError, readResponseJson } from "@/services/api-error";
import { serverApi } from "@/services/server-api";

export const getMyOrganizationOnServer = cache(async () => {
  try {
    const response = await serverApi(API_ENDPOINTS.backend.organizations.mine);
    if (response.status === 204 || response.status === 404) return null;
    if (!response.ok) {
      throw new ApiError(
        response,
        await readResponseJson(response),
        "Không thể tải hồ sơ tổ chức.",
      );
    }
    return organizationResponseSchema.parse(await response.json());
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});
