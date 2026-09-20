import { apiClientJson } from "@/services/api-client";
import type {
  LoginResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
} from "@/types/auth";

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
