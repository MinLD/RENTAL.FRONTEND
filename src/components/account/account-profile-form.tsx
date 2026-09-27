"use client";

import { AccountEditForm } from "@/components/account/account-edit-form";
import { AccountExternalLoginCard } from "@/components/account/account-external-login-card";
import { AccountProfileSummary } from "@/components/account/account-profile-summary";
import { AccountSessionList } from "@/components/account/account-session-list";
import type { AccountProfileInitialData } from "@/components/account/account-types";
import type {
  AuthUser,
  ExternalLoginResponse,
  UserSessionResponse,
} from "@/types/auth";

export type { AccountProfileInitialData } from "@/components/account/account-types";

type AccountProfileFormProps = {
  initialExternalLogins: ExternalLoginResponse[];
  initialProfile: AccountProfileInitialData;
  initialSessions: UserSessionResponse[];
  user: AuthUser;
};

export function AccountProfileForm({
  initialExternalLogins,
  initialProfile,
  initialSessions,
  user,
}: AccountProfileFormProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <AccountProfileSummary initialProfile={initialProfile} user={user} />

      <div className="space-y-5">
        <AccountEditForm initialProfile={initialProfile} />
        <AccountExternalLoginCard initialExternalLogins={initialExternalLogins} />
        <AccountSessionList initialSessions={initialSessions} />
      </div>
    </div>
  );
}
