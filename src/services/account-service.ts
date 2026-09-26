import { authApiClientJson } from "@/services/api-client";
import type {
  CompleteProfileRequest,
  ExternalLoginResponse,
  UpdateProfileRequest,
  UserSessionResponse,
} from "@/types/auth";

const EXTERNAL_LOGINS_ENDPOINT = "/api/v1/auth/users/me/external-logins";
const USER_PROFILE_ENDPOINT = "/api/v1/auth/users/me";
const USER_SESSIONS_ENDPOINT = "/api/v1/auth/users/me/sessions";

export function updateCurrentUserProfile(request: UpdateProfileRequest) {
  return authApiClientJson<void>(USER_PROFILE_ENDPOINT, {
    json: request,
    method: "PATCH",
  });
}

export function completeCurrentUserProfile(request: CompleteProfileRequest) {
  return authApiClientJson<void>(USER_PROFILE_ENDPOINT, {
    json: request,
    method: "POST",
  });
}

export function getExternalLogins() {
  return authApiClientJson<ExternalLoginResponse[]>(EXTERNAL_LOGINS_ENDPOINT);
}

export function unlinkExternalLogin(provider: string) {
  return authApiClientJson<void>(
    `${EXTERNAL_LOGINS_ENDPOINT}/${encodeURIComponent(provider)}`,
    {
      method: "DELETE",
    },
  );
}

export function getUserSessions() {
  return authApiClientJson<UserSessionResponse[]>(USER_SESSIONS_ENDPOINT);
}

export function revokeUserSession(sessionId: string) {
  return authApiClientJson<void>(`${USER_SESSIONS_ENDPOINT}/${sessionId}`, {
    method: "DELETE",
  });
}
