import { cache } from "react";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApi } from "@/services/server-api";
import type { AuthUser, CurrentUserResponse } from "@/types/auth";

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const response = await serverApi(API_ENDPOINTS.backend.currentUser.me);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CurrentUserResponse;
  } catch {
    return null;
  }
});

export const getCurrentUserCitizenIdOnServer = cache(async (): Promise<string | null> => {
  try {
    const response = await serverApi(API_ENDPOINTS.backend.currentUser.citizenId);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { citizenId?: string | null };
    return data?.citizenId ?? null;
  } catch {
    return null;
  }
});
