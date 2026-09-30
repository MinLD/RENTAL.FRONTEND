import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import type {
  ExternalLoginResponse,
  UserSessionResponse,
} from "@/types/auth";
import {
  type ApiValueResult,
  unwrapApiValue,
} from "@/utils/api-result";

export function getExternalLogins() {
  return authApiClientJson<
    ApiValueResult<ExternalLoginResponse[]> | ExternalLoginResponse[]
  >(API_ENDPOINTS.backend.currentUser.externalLogins).then((response) =>
    unwrapApiValue<ExternalLoginResponse[]>(response),
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

export function linkGoogleExternalLogin(idToken: string) {
  return authApiClientJson<void>(
    API_ENDPOINTS.backend.currentUser.externalLoginLink("Google"),
    {
      json: {
        idToken,
      },
      method: "POST",
    },
  );
}

export function getUserSessions() {
  return authApiClientJson<
    ApiValueResult<UserSessionResponse[]> | UserSessionResponse[]
  >(API_ENDPOINTS.backend.currentUser.sessions).then((response) =>
    unwrapApiValue<UserSessionResponse[]>(response),
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
