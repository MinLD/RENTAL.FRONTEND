"use client";

import { useState } from "react";

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
  const [avatarMediaId, setAvatarMediaId] = useState(
    initialProfile.avatarMediaId ?? "",
  );
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(
    initialProfile.avatarUrl ?? "",
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <AccountProfileSummary
        avatarPreviewUrl={avatarPreviewUrl}
        initialProfile={initialProfile}
        onAvatarChange={(mediaId, previewUrl) => {
          setAvatarMediaId(mediaId);
          setAvatarPreviewUrl(previewUrl);
        }}
        user={user}
      />

      <div className="space-y-5">
        <AccountEditForm
          avatarMediaId={avatarMediaId}
          initialProfile={initialProfile}
        />
        <AccountExternalLoginCard initialExternalLogins={initialExternalLogins} />
        <AccountSessionList initialSessions={initialSessions} />
      </div>
    </div>
  );
}
