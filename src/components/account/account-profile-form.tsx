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
  const [avatarDraft, setAvatarDraft] = useState<{
    mediaId: string;
    previewUrl: string;
  } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const savedAvatarMediaId = initialProfile.avatarMediaId ?? "";

  // The saved ID acknowledges the upload. Preview URLs can differ or expire.
  if (avatarDraft && avatarDraft.mediaId === savedAvatarMediaId) {
    setAvatarDraft(null);
  }
  const isAvatarDirty = avatarDraft !== null && avatarDraft.mediaId !== savedAvatarMediaId;
  const avatarMediaId = isAvatarDirty ? avatarDraft.mediaId : savedAvatarMediaId;
  const avatarPreviewUrl = isAvatarDirty ? avatarDraft.previewUrl : initialProfile.avatarUrl ?? "";

  function resetAvatar() {
    setAvatarDraft(null);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <AccountProfileSummary
        avatarPreviewUrl={avatarPreviewUrl}
        disabled={isSavingProfile}
        initialProfile={initialProfile}
        onAvatarChange={(mediaId, previewUrl) => {
          setAvatarDraft({ mediaId, previewUrl });
        }}
        onAvatarUploadingChange={setIsUploadingAvatar}
        user={user}
      />

      <div className="space-y-5">
        <AccountEditForm
          avatarMediaId={avatarMediaId}
          avatarPreviewUrl={avatarPreviewUrl}
          initialProfile={initialProfile}
          isAvatarDirty={isAvatarDirty}
          isAvatarUploading={isUploadingAvatar}
          onCancel={resetAvatar}
          onSavingChange={setIsSavingProfile}
          userId={user.id}
        />
        <AccountExternalLoginCard initialExternalLogins={initialExternalLogins} />
        <AccountSessionList initialSessions={initialSessions} />
      </div>
    </div>
  );
}
