"use client";

import Link from "next/link";
import {
  AlertCircle,
  Building2,
  Landmark,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UserRound,
  Warehouse,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccountBankAccounts } from "@/components/account/account-bank-accounts";
import { AccountEditForm } from "@/components/account/account-edit-form";
import { AccountExternalLoginCard } from "@/components/account/account-external-login-card";
import type { AccountProfileInitialData } from "@/components/account/account-types";
import { OwnerOrganizationForm } from "@/components/own/account/owner-organization-form";
import { WarehouseManagement } from "@/components/own/warehouse/warehouse-management";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Button } from "@/components/ui/button";
import { QueryProvider } from "@/providers/query-provider";
import {
  getOwnWarehouseAction,
  saveOwnWarehouseAction,
} from "@/services/actions/warehouse-actions";
import type { InitialRenterBankAccounts } from "@/services/renter-bank-account-server-service";
import type {
  AuthUser,
  ExternalLoginResponse,
} from "@/types/auth";
import type { OrganizationResponse } from "@/types/organization";
import { getProfileCompletion } from "@/utils/profile-completion";
import { cn } from "@/utils/cn";

export type OwnerAccountSection =
  | "organization"
  | "warehouse"
  | "bank-accounts"
  | "profile"
  | "security";
type OwnerAccountViewProps = {
  citizenId?: string | null;
  initialBankAccounts: InitialRenterBankAccounts;
  initialExternalLogins: ExternalLoginResponse[];
  initialOrganization: OrganizationResponse | null;
  initialProfile: AccountProfileInitialData;
  initialSection: OwnerAccountSection;
  user: AuthUser;
};

type AvatarPreview = {
  mediaId: string;
  previewUrl: string;
};

export function OwnerAccountView({
  citizenId,
  initialBankAccounts,
  initialExternalLogins,
  initialOrganization,
  initialProfile,
  initialSection,
  user,
}: OwnerAccountViewProps) {
  const router = useRouter();
  const [avatarDraft, setAvatarDraft] = useState<AvatarPreview | null>(null);
  const [savedAvatarPreview, setSavedAvatarPreview] =
    useState<AvatarPreview | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const savedAvatarMediaId = initialProfile.avatarMediaId ?? "";

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
    {
      section: "organization" as const,
      label: "Tổ chức & Trụ sở",
      icon: Building2,
    },
    {
      section: "warehouse" as const,
      label: "Địa chỉ kho hàng",
      icon: Warehouse,
    },
    {
      section: "bank-accounts" as const,
      label: "Tài khoản ngân hàng",
      icon: Landmark,
    },
    {
      section: "profile" as const,
      label: "Thông tin cá nhân",
      icon: UserRound,
    },
    {
      section: "security" as const,
      label: "Bảo mật",
      icon: LockKeyhole,
    },
  ];

  const orgDisplayName = initialOrganization?.name ?? user.fullName ?? "Chủ thiết bị";
  const orgLogoUrl = initialOrganization?.logoUrl ?? user.avatarUrl ?? undefined;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Sidebar Overview & Navigation */}
      <aside className="min-w-0 self-start rounded-lg border border-border bg-background p-6 shadow-sm lg:sticky lg:top-6">
        <div className="flex flex-col items-center text-center pb-5 border-b border-border">
          <AvatarWithSkeleton
            alt={orgDisplayName}
            className="size-20 border-2 border-border/80 shadow-inner"
            fallback={orgDisplayName.slice(0, 2).toUpperCase()}
            fallbackClassName="text-lg font-bold bg-muted text-foreground"
            src={orgLogoUrl}
          />
          <h2 className="mt-4 line-clamp-2 w-full break-words text-lg font-bold text-foreground" title={orgDisplayName}>
            {orgDisplayName}
          </h2>
          {initialOrganization?.taxCode ? (
            <p className="mt-1 text-xs text-muted-foreground">
              MST: {initialOrganization.taxCode}
            </p>
          ) : null}
          <p className="mt-2 text-xs font-semibold text-primary">
            Đối tác nhà cung cấp
          </p>
        </div>

        {/* Tab links */}
        <nav aria-label="Quản lý tài khoản" className="mt-6 space-y-1 border-t border-border pt-4">
          {menu.map(({ section, label, icon: Icon }) => (
            <Link
              aria-current={initialSection === section ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors hover:text-primary",
                initialSection === section ? "font-semibold text-primary" : "text-foreground",
              )}
              href={section === "organization" ? "/own/account" : `/own/account?section=${section}`}
              key={section}
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Tab Content */}
      <div className="min-w-0">
        {initialSection === "organization" && (
          initialOrganization ? (
            <OwnerOrganizationForm
              citizenId={citizenId}
              organization={initialOrganization}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center shadow-sm">
              <Building2 className="mx-auto size-12 text-muted-foreground/60" />
              <h2 className="mt-3 text-lg font-bold text-foreground">
                Chưa có thông tin tổ chức
              </h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Tài khoản của bạn chưa được liên kết với hồ sơ tổ chức nào. Vui lòng hoàn tất đăng ký đối tác để cập nhật thông tin doanh nghiệp.
              </p>
              <div className="mt-5">
                <Button asChild>
                  <Link href="/partner">Đến trang Đăng ký đối tác</Link>
                </Button>
              </div>
            </div>
          )
        )}

        {initialSection === "warehouse" && (
          <WarehouseManagement
            embedded
            fetchWarehouse={getOwnWarehouseAction}
            saveWarehouse={saveOwnWarehouseAction}
          />
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

        {initialSection === "profile" && (
          <AccountEditForm
            avatarMediaId={avatarMediaId}
            avatarPreviewUrl={avatarPreviewUrl}
            initialProfile={initialProfile}
            isAvatarDirty={isAvatarDirty}
            isAvatarUploading={isUploadingAvatar}
            isProfileComplete={getProfileCompletion(user).isComplete}
            onCancel={resetAvatar}
            onSavingChange={setIsSavingProfile}
            userId={user.id}
          />
        )}

        {initialSection === "security" && (
          <AccountExternalLoginCard initialExternalLogins={initialExternalLogins} />
        )}
      </div>
    </div>
  );
}
