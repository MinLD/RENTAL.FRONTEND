export type UserOrganizationResponse = {
  organizationId: string;
  name: string | null;
  roleName: string | null;
  slug: string | null;
  type: 0 | 1 | 2;
};

export type CurrentUserResponse = {
  avatarMediaId: string | null;
  avatarUrl: string | null;
  createdAt: string;
  dateOfBirth: string | null;
  email: string | null;
  fullName: string | null;
  hasPassword: boolean;
  id: string;
  isProfileCompleted: boolean;
  maskedCitizenId: string | null;
  organizations: UserOrganizationResponse[] | null;
  permissions: string[] | null;
  phoneNumber: string | null;
  roles: string[] | null;
};

export type AuthUser = CurrentUserResponse;

export type CurrentUserCitizenIdResponse = {
  citizenId: string | null;
};

export type ExternalLoginResponse = {
  createdAtUtc?: string | null;
  email?: string | null;
  linkedAtUtc?: string | null;
  provider?: string | null;
};

export type UpdateProfileRequest = {
  avatarMediaId: string | null;
  citizenId?: string | null;
  dateOfBirth: string | null;
  fullName: string;
  phoneNumber: string | null;
  removeAvatar: boolean;
};

export type ChangePasswordRequest = {
  newPassword: string;
  oldPassword: string;
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

export type FirebaseLoginRequest = {
  idToken: string;
};

export type FirebaseLoginResponse = {
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
