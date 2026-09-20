import { cache } from "react";
import { headers } from "next/headers";

import { mapCurrentUserResponse } from "@/services/auth-mappers";
import { buildBackendApiUrl } from "@/services/backend-api";
import type { AuthUser, CurrentUserResponse } from "@/types/auth";

const AUTH_ME_ENDPOINT = "/api/v1/auth/users/me";

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");

  const response = await fetch(
    buildBackendApiUrl(AUTH_ME_ENDPOINT),
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    },
  );

  if (response.status === 401 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to fetch current user.");
  }

  const currentUserResponse = (await response.json()) as CurrentUserResponse;

  return mapCurrentUserResponse(currentUserResponse);
});
