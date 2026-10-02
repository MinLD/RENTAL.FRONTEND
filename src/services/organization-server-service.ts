import "server-only";

import { cache } from "react";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { organizationResponseSchema } from "@/lib/validations/organization";
import { ApiClientError } from "@/services/api-client";
import { serverApi } from "@/services/server-api";

export const getMyOrganizationOnServer = cache(async () => {
  const response = await serverApi(API_ENDPOINTS.backend.organizations.mine);
  if (!response.ok) throw new ApiClientError(response);
  if (response.status === 204) return null;
  if (response.status !== 200) throw new Error("Unexpected organization response.");
  return organizationResponseSchema.parse(await response.json());
});
