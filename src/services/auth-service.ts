import { apiClientJson } from "@/services/api-client";
import type {
  LoginResponse,
  LoginRequest,
  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  ResetPasswordRequest,
  RegisterRequest,
  RegisterResponse,
  VerifyPasswordResetCodeRequest,
  VerifyPasswordResetCodeResponse,
} from "@/types/auth";

const PASSWORD_RESET_ENDPOINTS = {
  request: "/api/mock/auth/password-reset/request",
  reset: "/api/mock/auth/password-reset/reset",
  verify: "/api/mock/auth/password-reset/verify",
} as const;

export function getGoogleLoginUrl(returnUrl = "/") {
  const searchParams = new URLSearchParams({
    returnUrl,
  });

  return `/api/auth/google/login?${searchParams.toString()}`;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  return apiClientJson<LoginResponse>("/api/auth/login", {
    json: {
      email: request.email,
      password: request.password,
    },
    method: "POST",
  });
}

export async function register(
  request: RegisterRequest,
): Promise<RegisterResponse> {
  return apiClientJson<RegisterResponse>("/api/v1/auth/register", {
    json: {
      email: request.email,
      fullName: request.name,
      password: request.password,
    },
    method: "POST",
  });
}

export async function logout(): Promise<void> {
  await apiClientJson<void>("/api/auth/logout", {
    method: "POST",
  });
}

export async function refreshSession(): Promise<void> {
  await apiClientJson<void>("/api/auth/refresh", {
    method: "POST",
  });
}

export async function requestPasswordReset(
  request: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
  return apiClientJson<RequestPasswordResetResponse>(
    PASSWORD_RESET_ENDPOINTS.request,
    {
      json: request,
      method: "POST",
    },
  );
}

export async function verifyPasswordResetCode(
  request: VerifyPasswordResetCodeRequest,
): Promise<VerifyPasswordResetCodeResponse> {
  return apiClientJson<VerifyPasswordResetCodeResponse>(
    PASSWORD_RESET_ENDPOINTS.verify,
    {
      json: request,
      method: "POST",
    },
  );
}

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<void> {
  await apiClientJson<void>(PASSWORD_RESET_ENDPOINTS.reset, {
    json: request,
    method: "POST",
  });
}
