import { API_ENDPOINTS } from "@/config/api-endpoints";
import { apiClientJson } from "@/services/api-client";
import type {
  LoginResponse,
  LoginRequest,
  FirebaseLoginRequest,
  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  ResetPasswordRequest,
  RegisterRequest,
  RegisterResponse,
  VerifyPasswordResetCodeRequest,
  VerifyPasswordResetCodeResponse,
} from "@/types/auth";

export async function login(request: LoginRequest): Promise<LoginResponse> {
  return apiClientJson<LoginResponse>(API_ENDPOINTS.internal.auth.login, {
    json: {
      email: request.email,
      password: request.password,
    },
    method: "POST",
  });
}

export async function loginWithFirebaseIdToken(
  request: FirebaseLoginRequest,
): Promise<LoginResponse> {
  return apiClientJson<LoginResponse>(API_ENDPOINTS.internal.auth.firebaseLogin, {
    json: request,
    method: "POST",
  });
}

export async function register(
  request: RegisterRequest,
): Promise<RegisterResponse> {
  return apiClientJson<RegisterResponse>(API_ENDPOINTS.backend.auth.register, {
    json: {
      email: request.email,
      fullName: request.name,
      password: request.password,
    },
    method: "POST",
  });
}

type AuthEventListener = () => void;
const logoutListeners = new Set<AuthEventListener>();

export function onAuthLogout(listener: AuthEventListener): () => void {
  logoutListeners.add(listener);
  return () => {
    logoutListeners.delete(listener);
  };
}

export async function logout(): Promise<void> {
  try {
    await apiClientJson<void>(API_ENDPOINTS.internal.auth.logout, {
      method: "POST",
    });
  } finally {
    for (const listener of logoutListeners) {
      try {
        listener();
      } catch {}
    }
  }
}

export async function refreshSession(): Promise<void> {
  await apiClientJson<void>(API_ENDPOINTS.internal.auth.refresh, {
    method: "POST",
  });
}

export async function requestPasswordReset(
  request: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
  return apiClientJson<RequestPasswordResetResponse>(
    API_ENDPOINTS.internal.mock.passwordReset.request,
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
    API_ENDPOINTS.internal.mock.passwordReset.verify,
    {
      json: request,
      method: "POST",
    },
  );
}

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<void> {
  await apiClientJson<void>(API_ENDPOINTS.internal.mock.passwordReset.reset, {
    json: request,
    method: "POST",
  });
}
