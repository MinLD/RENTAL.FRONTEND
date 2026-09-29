import { CalendarDays, IdCard, Phone } from "lucide-react";
import type { ReactNode } from "react";

import type { AccountProfileInitialData } from "@/components/account/account-types";
import {
  displayProfileValue,
  formatDisplayDate,
  getUserInitials,
  maskIdentityNumber,
} from "@/components/account/account-utils";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import type { AuthUser } from "@/types/auth";
import {
  getAuthUserDisplayName,
  getAuthUserRoleLabel,
} from "@/utils/auth-user";

type AccountProfileSummaryProps = {
  avatarPreviewUrl?: string;
  initialProfile: AccountProfileInitialData;
  onAvatarChange?: (mediaId: string, previewUrl: string) => void;
  user: AuthUser;
};

export function AccountProfileSummary({
  avatarPreviewUrl,
  initialProfile,
  onAvatarChange,
  user,
}: AccountProfileSummaryProps) {
  const visibleAvatarUrl = avatarPreviewUrl ?? initialProfile.avatarUrl;
  const displayName = getAuthUserDisplayName(user);
  const roleLabel = getAuthUserRoleLabel(user);

  return (
    <aside className="self-start rounded-lg border border-border bg-background p-6 shadow-sm lg:sticky lg:top-6">
      <div className="flex flex-col items-center text-center">
        <MediaAvatarUpload
          fallbackText={getUserInitials(displayName)}
          onChange={(mediaId, upload) => {
            if (typeof mediaId === "string" && !Array.isArray(upload)) {
              onAvatarChange?.(mediaId, upload.previewUrl);
            }
          }}
          previewUrl={visibleAvatarUrl}
          size="lg"
        />

        <h2 className="mt-4 text-lg font-bold text-foreground">
          {displayProfileValue(displayName)}
        </h2>
        <p className="mt-1 max-w-full truncate text-xs text-muted-foreground">
          {displayProfileValue(user.email)}
        </p>
        <p className="mt-2 text-xs font-semibold text-primary">
          {displayProfileValue(roleLabel)}
        </p>
      </div>

      <div className="mt-8 space-y-5">
        <ProfileInfoItem
          icon={<Phone size={16} />}
          label="Số điện thoại"
          value={initialProfile.phoneNumber}
        />
        <ProfileInfoItem
          icon={<CalendarDays size={16} />}
          label="Ngày sinh"
          value={formatDisplayDate(initialProfile.dateOfBirth)}
        />
        <ProfileInfoItem
          icon={<IdCard size={16} />}
          label="CCCD/CMND"
          value={maskIdentityNumber(initialProfile.identityNumber)}
        />
      </div>
    </aside>
  );
}

function ProfileInfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
          {displayProfileValue(value)}
        </p>
      </div>
    </div>
  );
}
