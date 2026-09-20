export type AuthUser = {
  email: string;
  id: string;
  name: string;
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
  createdAt: string;
  email: string | null;
  fullName: string | null;
  id: string;
  organizations: UserOrganizationResponse[] | null;
  permissions: string[] | null;
  roles: string[] | null;
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

export type RegisterResponse = {
  accountId: string;
};
