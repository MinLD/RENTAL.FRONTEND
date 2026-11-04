import type { Metadata } from "next";

import type { AccountProfileInitialData } from "@/components/account/account-types";
import {
  OwnerAccountView,
  type OwnerAccountSection,
} from "@/components/own/account/owner-account-view";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { getMyOrganizationOnServer } from "@/services/organization-server-service";
import { getRenterBankAccountsForServer } from "@/services/renter-bank-account-server-service";
import { serverApi } from "@/services/server-api";
import {
  getCurrentUser,
  getCurrentUserCitizenIdOnServer,
} from "@/services/session-service";
import type {
  CurrentUserResponse,
  ExternalLoginResponse,
} from "@/types/auth";
import {
  type ApiValueResult,
  unwrapApiValue,
} from "@/utils/api-result";
import {
  getAuthUserDisplayName,
  getAuthUserIdentityNumber,
  getAuthUserRoleLabel,
} from "@/utils/auth-user";

export const metadata: Metadata = {
  title: "Quản lý tài khoản chủ thiết bị",
};

export default async function OwnAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedSection = Array.isArray(params.section)
    ? params.section[0]
    : params.section;

  const initialSection: OwnerAccountSection =
    requestedSection === "warehouse" ||
    requestedSection === "bank-accounts" ||
    requestedSection === "profile" ||
    requestedSection === "security"
      ? requestedSection
      : "organization";

  const [
    currentUser,
    citizenId,
    initialOrganization,
    initialBankAccounts,
    externalLogins,
  ] = await Promise.all([
    getCurrentUser(),
    getCurrentUserCitizenIdOnServer(),
    getMyOrganizationOnServer(),
    initialSection === "bank-accounts"
      ? getRenterBankAccountsForServer()
      : Promise.resolve({ bankAccounts: [], error: null }),
    initialSection === "security"
      ? getInitialExternalLogins()
      : Promise.resolve([]),
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
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
        <header className="space-y-1">
          <h1 className="text-xl font-bold text-foreground">
            Quản lý tài khoản
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin tổ chức, địa chỉ trụ sở, tài khoản ngân hàng và bảo mật của chủ thiết bị.
          </p>
        </header>

        <OwnerAccountView
          citizenId={citizenId}
          initialBankAccounts={initialBankAccounts}
          initialExternalLogins={externalLogins}
          initialOrganization={initialOrganization}
          initialProfile={initialProfile}
          initialSection={initialSection}
          user={user}
        />
      </div>
    </div>
  );
}

async function getInitialExternalLogins() {
  try {
    const response = await serverApi(
      API_ENDPOINTS.backend.currentUser.externalLogins,
    );

    if (!response.ok) {
      return [];
    }

    const responseBody = (await response.json()) as
      | ApiValueResult<ExternalLoginResponse[]>
      | ExternalLoginResponse[];

    return unwrapApiValue<ExternalLoginResponse[]>(responseBody);
  } catch {
    return [];
  }
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const [datePart] = value.split("T");
  return datePart ?? "";
}
