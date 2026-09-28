import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import type {
  CompleteProfileRequest,
  ExternalLoginResponse,
  UserSessionResponse,
} from "@/types/auth";

export function completeCurrentUserProfile(request: CompleteProfileRequest) {
  return authApiClientJson<void>(API_ENDPOINTS.backend.currentUser.me, {
    json: request,
    method: "POST",
  });
}

export function getExternalLogins() {
  return authApiClientJson<ExternalLoginResponse[]>(
    API_ENDPOINTS.backend.currentUser.externalLogins,
  );
}

export function unlinkExternalLogin(provider: string) {
  return authApiClientJson<void>(
    API_ENDPOINTS.backend.currentUser.externalLogin(provider),
    {
      method: "DELETE",
    },
  );
}

export function getUserSessions() {
  return authApiClientJson<UserSessionResponse[]>(
    API_ENDPOINTS.backend.currentUser.sessions,
  );
}

export function revokeUserSession(sessionId: string) {
  return authApiClientJson<void>(
    API_ENDPOINTS.backend.currentUser.session(sessionId),
    {
      method: "DELETE",
    },
  );
}
