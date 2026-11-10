"use client";

import Link from "next/link";
import { Landmark, LockKeyhole, MapPin, Star, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccountAddressBook } from "@/components/account/account-address-book";
import { AccountBankAccounts } from "@/components/account/account-bank-accounts";
import { AccountEditForm } from "@/components/account/account-edit-form";
import { AccountExternalLoginCard } from "@/components/account/account-external-login-card";
import { AccountProfileSummary } from "@/components/account/account-profile-summary";
import { AccountReviewsSection } from "@/components/account/account-reviews-section";
import { QueryProvider } from "@/providers/query-provider";
import type { InitialRenterAddresses } from "@/services/renter-address-server-service";
import type { InitialRenterBankAccounts } from "@/services/renter-bank-account-server-service";
import type { InitialAccountReviewsData } from "@/services/review-server-service";
import type { AccountProfileInitialData } from "@/components/account/account-types";
import type {
  AuthUser,
  ExternalLoginResponse,
} from "@/types/auth";
import { getProfileCompletion } from "@/utils/profile-completion";
import { withReturnTo } from "@/utils/return-to";
import { cn } from "@/utils/cn";

export type { AccountProfileInitialData } from "@/components/account/account-types";
export type AccountSection =
  | "profile"
  | "security"
  | "addresses"
  | "bank-accounts"
  | "reviews";

type AccountProfileFormProps = {
  initialAddresses: InitialRenterAddresses;
  initialBankAccounts: InitialRenterBankAccounts;
  initialExternalLogins: ExternalLoginResponse[];
  initialProfile: AccountProfileInitialData;
  initialReviews?: InitialAccountReviewsData | null;
  initialSection: AccountSection;
  returnTo?: string;
  user: AuthUser;
};

type AvatarPreview = {
  mediaId: string;
  previewUrl: string;
};

export function AccountProfileForm({
  initialAddresses,
  initialBankAccounts,
  initialExternalLogins,
  initialProfile,
  initialReviews,
  initialSection,
  returnTo,
  user,
}: AccountProfileFormProps) {
  const router = useRouter();
  const [avatarDraft, setAvatarDraft] = useState<AvatarPreview | null>(null);
  const [savedAvatarPreview, setSavedAvatarPreview] =
    useState<AvatarPreview | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const savedAvatarMediaId = initialProfile.avatarMediaId ?? "";

  // A matching saved ID acknowledges the upload without discarding its image.
  // The profile URL may be unavailable even though the upload preview works.
  if (avatarDraft && avatarDraft.mediaId === savedAvatarMediaId) {
    setSavedAvatarPreview(avatarDraft);
    setAvatarDraft(null);
  }
  const isAvatarDirty =
    avatarDraft !== null && avatarDraft.mediaId !== savedAvatarMediaId;
  const avatarMediaId = isAvatarDirty ? avatarDraft.mediaId : savedAvatarMediaId;
  const savedAvatarUrl =
    savedAvatarPreview?.mediaId === savedAvatarMediaId
      ? savedAvatarPreview.previewUrl
      : initialProfile.avatarUrl ?? "";
  const avatarPreviewUrl = avatarDraft?.previewUrl ?? savedAvatarUrl;

  function resetAvatar() {
    setAvatarDraft(null);
  }

  const menu = [
    { section: "profile", label: "Thông tin tài khoản", icon: UserRound },
    { section: "security", label: "Bảo mật", icon: LockKeyhole },
    { section: "addresses", label: "Sổ địa chỉ", icon: MapPin },
    { section: "bank-accounts", label: "Tài khoản ngân hàng", icon: Landmark },
    { section: "reviews", label: "Đánh giá của tôi", icon: Star },
  ] as const;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <AccountProfileSummary
        avatarPreviewUrl={avatarPreviewUrl}
        disabled={isSavingProfile}
        initialProfile={initialProfile}
        onAvatarChange={(mediaId, previewUrl) => {
          setAvatarDraft({ mediaId, previewUrl });
        }}
        onAvatarUploadingChange={setIsUploadingAvatar}
        onAvatarButtonClick={initialSection === "profile" ? undefined : () => router.push(withReturnTo("/account", returnTo))}
        user={user}
      >
        <nav aria-label="Quản lý tài khoản" className="mt-6 space-y-1 border-t border-border pt-4">
          {menu.map(({ section, label, icon: Icon }) => (
            <Link
              aria-current={initialSection === section ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors hover:text-primary",
                initialSection === section ? "font-semibold text-primary" : "text-foreground",
              )}
              href={withReturnTo(section === "profile" ? "/account" : `/account?section=${section}`, returnTo)}
              key={section}
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </AccountProfileSummary>

      <div className="min-w-0">
        {initialSection === "profile" && (
          <AccountEditForm
            key={returnTo ?? "account"}
            avatarMediaId={avatarMediaId}
            avatarPreviewUrl={avatarPreviewUrl}
            initialProfile={initialProfile}
            isAvatarDirty={isAvatarDirty}
            isAvatarUploading={isUploadingAvatar}
            isProfileComplete={getProfileCompletion(user).isComplete}
            onCancel={resetAvatar}
            onSavingChange={setIsSavingProfile}
            returnTo={returnTo}
            userId={user.id}
          />
        )}
        {initialSection === "security" && <AccountExternalLoginCard initialExternalLogins={initialExternalLogins} />}
        {initialSection === "addresses" && (
          <QueryProvider>
            <AccountAddressBook
              initialAddresses={initialAddresses.addresses}
              initialError={initialAddresses.error}
              userId={user.id}
            />
          </QueryProvider>
        )}
        {initialSection === "bank-accounts" && (
          <QueryProvider>
            <AccountBankAccounts
              initialBankAccounts={initialBankAccounts.bankAccounts}
              initialError={initialBankAccounts.error}
              userId={user.id}
            />
          </QueryProvider>
        )}
        {initialSection === "reviews" && (
          <AccountReviewsSection initialData={initialReviews} />
        )}
      </div>
    </div>
  );
}
