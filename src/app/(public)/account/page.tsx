import Link from "next/link";

import {
  AccountProfileForm,
  type AccountProfileInitialData,
} from "@/components/account/account-profile-form";
import { Container } from "@/components/layout/container";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { serverApi } from "@/services/server-api";
import { getCurrentUser } from "@/services/session-service";
import type {
  CurrentUserResponse,
  ExternalLoginResponse,
  UserSessionResponse,
} from "@/types/auth";
import {
  getAuthUserDisplayName,
  getAuthUserIdentityNumber,
  getAuthUserRoleLabel,
} from "@/utils/auth-user";

export default async function AccountPage() {
  const [currentUser, sessions, externalLogins] = await Promise.all([
    getCurrentUser(),
    getInitialSessions(),
    getInitialExternalLogins(),
  ]);
  const user =
    currentUser ??
    ({
      avatarMediaId: null,
      avatarUrl: null,
      createdAt: "",
      dateOfBirth: null,
      email: "",
      fullName: "",
      hasPassword: false,
      id: "",
      isProfileCompleted: false,
      maskedCitizenId: null,
      organizations: [],
      permissions: [],
      phoneNumber: null,
      roles: [],
    } satisfies CurrentUserResponse);
  const initialProfile: AccountProfileInitialData = {
    avatarMediaId: user.avatarMediaId ?? "",
    avatarUrl: user.avatarUrl ?? "",
    dateOfBirth: toDateInputValue(user.dateOfBirth),
    email: user.email ?? "",
    fullName: getAuthUserDisplayName(user),
    identityNumber: getAuthUserIdentityNumber(user),
    phoneNumber: user.phoneNumber ?? "",
    roleLabel: getAuthUserRoleLabel(user),
  };

  return (
    <div className="flex flex-1 flex-col bg-[#f5f7fa] py-6">
      <Container>
        <nav
          aria-label="Breadcrumb"
          className="mb-5 text-xs text-muted-foreground"
        >
          <Link className="transition-colors hover:text-primary" href="/">
            Trang chủ
          </Link>
          <span className="mx-1.5">/</span>
          <span className="font-medium text-foreground">Tài khoản của tôi</span>
        </nav>

        <AccountProfileForm
          initialExternalLogins={externalLogins}
          initialProfile={initialProfile}
          initialSessions={sessions}
          user={user}
        />
      </Container>
    </div>
  );
}

async function getInitialSessions() {
  try {
    const response = await serverApi(
      API_ENDPOINTS.backend.currentUser.sessions,
    );

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as UserSessionResponse[];
  } catch {
    return [];
  }
}

async function getInitialExternalLogins() {
  try {
    const response = await serverApi(
      API_ENDPOINTS.backend.currentUser.externalLogins,
    );

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as ExternalLoginResponse[];
  } catch {
    return [];
  }
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.split("T")[0] ?? "";
}
