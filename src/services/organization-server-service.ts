import "server-only";

import { cache } from "react";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { organizationResponseSchema } from "@/lib/validations/organization";
import { serverApiOk } from "@/services/server-api";

export const getMyOrganizationOnServer = cache(async () => {
  const response = await serverApiOk(
    API_ENDPOINTS.backend.organizations.mine,
    "Không thể tải hồ sơ tổ chức.",
  );
  if (response.status === 204) return null;
  if (response.status !== 200) throw new Error("Unexpected organization response.");
  return organizationResponseSchema.parse(await response.json());
});
