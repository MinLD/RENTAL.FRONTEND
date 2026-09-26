import Link from "next/link";

import {
  AccountProfileForm,
  type AccountProfileInitialData,
} from "@/components/account/account-profile-form";
import { Container } from "@/components/layout/container";
import { serverApi } from "@/services/server-api";
import { getCurrentUser } from "@/services/session-service";
import type { ExternalLoginResponse, UserSessionResponse } from "@/types/auth";

const EXTERNAL_LOGINS_ENDPOINT = "/api/v1/auth/users/me/external-logins";
const USER_SESSIONS_ENDPOINT = "/api/v1/auth/users/me/sessions";

export default async function AccountPage() {
  const user = (await getCurrentUser()) ?? {
    email: "",
    id: "",
    isProfileCompleted: true,
    name: "",
    roleLabel: "Tài khoản",
  };

  const sessions = await getInitialSessions();
  const externalLogins = await getInitialExternalLogins();
  const initialProfile: AccountProfileInitialData = {
    avatarUrl: user.avatarUrl ?? "",
    dateOfBirth: toDateInputValue(user.dateOfBirth),
    email: user.email,
    fullName: user.name,
    identityNumber: user.identityNumber ?? "",
    phoneNumber: user.phoneNumber ?? "",
    roleLabel: user.roleLabel,
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
    const response = await serverApi(USER_SESSIONS_ENDPOINT);

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
    const response = await serverApi(EXTERNAL_LOGINS_ENDPOINT);

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
