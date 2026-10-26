import Link from "next/link";

import {
  AccountProfileForm,
  type AccountSection,
  type AccountProfileInitialData,
} from "@/components/account/account-profile-form";
import { Container } from "@/components/layout/container";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { getRenterAddressesForServer } from "@/services/renter-address-server-service";
import { getRenterBankAccountsForServer } from "@/services/renter-bank-account-server-service";
import { serverApi } from "@/services/server-api";
import { getCurrentUser } from "@/services/session-service";
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
import { getSafeReturnTo, type ReturnToSearchParams } from "@/utils/return-to";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<ReturnToSearchParams>;
}) {
  const params = await searchParams;
  const requestedReturnTo = getSafeReturnTo(
    Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo,
  );
  // Returning to the same form would leave an unnecessary continuation URL.
  const returnTo = requestedReturnTo?.split(/[?#]/)[0] === "/account"
    ? null
    : requestedReturnTo;
  const requestedSection = Array.isArray(params.section) ? params.section[0] : params.section;
  const initialSection: AccountSection =
    requestedSection === "security" ||
    requestedSection === "addresses" ||
    requestedSection === "bank-accounts"
      ? requestedSection
      : "profile";
  const [currentUser, externalLogins, initialAddresses, initialBankAccounts] =
    await Promise.all([
      getCurrentUser(),
      initialSection === "security"
        ? getInitialExternalLogins()
        : Promise.resolve([]),
      initialSection === "addresses"
        ? getRenterAddressesForServer()
        : Promise.resolve({ addresses: [], error: null }),
      initialSection === "bank-accounts"
        ? getRenterBankAccountsForServer()
        : Promise.resolve({ bankAccounts: [], error: null }),
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
          initialAddresses={initialAddresses}
          initialBankAccounts={initialBankAccounts}
          initialExternalLogins={externalLogins}
          initialProfile={initialProfile}
          initialSection={initialSection}
          returnTo={returnTo ?? undefined}
          user={user}
        />
      </Container>
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

  return value.split("T")[0] ?? "";
}
