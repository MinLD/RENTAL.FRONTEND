import type {
  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  ResetPasswordRequest,
  VerifyPasswordResetCodeRequest,
  VerifyPasswordResetCodeResponse,
} from "@/types/auth";

const MOCK_PASSWORD_RESET_CODE = "123456";
const MOCK_PASSWORD_RESET_TOKEN = "mock-password-reset-token";

export class MockApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MockApiError";
    this.status = status;
  }
}

export async function mockRequestPasswordReset(
  request: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
  await simulateNetworkDelay();

  if (!request.identifier.trim()) {
    throw new MockApiError("Vui lòng nhập email hoặc số điện thoại.");
  }

  return {
    expiresInSeconds: 120,
    maskedContact: maskContact(request.identifier),
    resendInSeconds: 45,
  };
}

export async function mockVerifyPasswordResetCode(
  request: VerifyPasswordResetCodeRequest,
): Promise<VerifyPasswordResetCodeResponse> {
  await simulateNetworkDelay();

  if (request.code !== MOCK_PASSWORD_RESET_CODE) {
    throw new MockApiError("Mã xác thực không chính xác.");
  }

  return {
    resetToken: MOCK_PASSWORD_RESET_TOKEN,
  };
}

export async function mockResetPassword(
  request: ResetPasswordRequest,
): Promise<void> {
  await simulateNetworkDelay();

  if (request.resetToken !== MOCK_PASSWORD_RESET_TOKEN) {
    throw new MockApiError("Phiên đặt lại mật khẩu không hợp lệ.");
  }

  if (request.password !== request.confirmPassword) {
    throw new MockApiError("Mật khẩu xác nhận không khớp.");
  }
}

function simulateNetworkDelay() {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, 400);
  });
}

function maskContact(identifier: string) {
  const normalizedIdentifier = identifier.trim();

  if (!normalizedIdentifier.includes("@")) {
    return normalizedIdentifier.replace(/(\d{2})\d+(\d{2})/, "$1***$2");
  }

  const [name = "", domain = ""] = normalizedIdentifier.split("@");
  const visiblePrefix = name.slice(0, 2);

  return `${visiblePrefix}***@${domain}`;
}
