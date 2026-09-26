export type AuthUser = {
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  email: string;
  hasPassword?: boolean;
  id: string;
  identityNumber?: string | null;
  isProfileCompleted?: boolean;
  name: string;
  phoneNumber?: string | null;
  roleLabel: string;
};

export type UserOrganizationResponse = {
  organizationId: string;
  name: string | null;
  roleName: string | null;
  slug: string | null;
  type: 0 | 1 | 2;
};

export type CurrentUserResponse = {
  avatarUrl?: string | null;
  createdAt: string;
  dateOfBirth?: string | null;
  email: string | null;
  fullName: string | null;
  hasPassword?: boolean;
  id: string;
  identityNumber?: string | null;
  isProfileCompleted?: boolean;
  maskedCitizenId?: string | null;
  organizations: UserOrganizationResponse[] | null;
  permissions: string[] | null;
  phoneNumber?: string | null;
  roles: string[] | null;
};

export type UserSessionResponse = {
  createdAtUtc: string;
  expiresAtUtc: string;
  id: string;
  isActive: boolean;
  isCurrent: boolean;
  revokedAtUtc?: string | null;
};

export type ExternalLoginResponse = {
  email?: string | null;
  linkedAtUtc: string;
  provider?: string | null;
};

export type UpdateProfileRequest = {
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
};

export type CompleteProfileRequest = {
  avatarUrl?: string | null;
  citizenId?: string | null;
  dateOfBirth?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type RegisterAccountType = "customer" | "supplier";

export type RegisterRequest = {
  acceptTerms: boolean;
  accountType: RegisterAccountType;
  confirmPassword: string;
  email: string;
  name: string;
  password: string;
};

export type LoginResponse = {
  message?: string | null;
  userId?: string | null;
};

export type GoogleExchangeRequest = {
  ticket: string;
};

export type GoogleExchangeResponse = {
  accessToken: string;
  refreshToken: string;
};

export type RegisterResponse = {
  accountId: string;
};

export type RequestPasswordResetRequest = {
  identifier: string;
};

export type RequestPasswordResetResponse = {
  expiresInSeconds: number;
  maskedContact: string;
  resendInSeconds: number;
};

export type VerifyPasswordResetCodeRequest = {
  code: string;
  identifier: string;
};

export type VerifyPasswordResetCodeResponse = {
  resetToken: string;
};

export type ResetPasswordRequest = {
  confirmPassword: string;
  password: string;
  resetToken: string;
};
