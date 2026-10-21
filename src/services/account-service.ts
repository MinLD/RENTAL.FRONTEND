import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import type {
  CurrentUserCitizenIdResponse,
  ExternalLoginResponse,
} from "@/types/auth";
import {
  type ApiValueResult,
  unwrapApiValue,
} from "@/utils/api-result";

export async function getCurrentUserCitizenId(signal?: AbortSignal) {
  const response = await authApiClientJson<CurrentUserCitizenIdResponse>(
    API_ENDPOINTS.backend.currentUser.citizenId,
    { cache: "no-store", signal },
  );

  if (!response?.citizenId) {
    throw new Error("Bạn chưa cập nhật CCCD/CMND.");
  }
  if (
    typeof response.citizenId !== "string" ||
    !/^\d{12}$/.test(response.citizenId)
  ) {
    throw new Error("Không thể đọc CCCD/CMND. Vui lòng thử lại.");
  }
  return response.citizenId;
}

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
