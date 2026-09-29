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
