import type { AccountProfileInitialData } from "@/components/account/account-types";
import {
  displayProfileValue,
  getUserInitials,
} from "@/components/account/account-utils";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import type { AuthUser } from "@/types/auth";
import {
  getAuthUserDisplayName,
  getAuthUserRoleLabel,
} from "@/utils/auth-user";

type AccountProfileSummaryProps = {
  avatarPreviewUrl?: string;
  disabled?: boolean;
  initialProfile: AccountProfileInitialData;
  onAvatarChange?: (mediaId: string, previewUrl: string) => void;
  onAvatarUploadingChange?: (isUploading: boolean) => void;
  user: AuthUser;
};

export function AccountProfileSummary({
  avatarPreviewUrl,
  disabled,
  initialProfile,
  onAvatarChange,
  onAvatarUploadingChange,
  user,
}: AccountProfileSummaryProps) {
  const visibleAvatarUrl = avatarPreviewUrl ?? initialProfile.avatarUrl;
  const displayName = getAuthUserDisplayName(user);
  const roleLabel = getAuthUserRoleLabel(user);

  return (
    <aside className="min-w-0 self-start rounded-lg border border-border bg-background p-6 shadow-sm lg:sticky lg:top-6">
      <div className="flex flex-col items-center text-center">
        <MediaAvatarUpload
          disabled={disabled}
          fallbackText={getUserInitials(displayName)}
          onChange={(mediaId, upload) => {
            if (typeof mediaId === "string" && !Array.isArray(upload)) {
              onAvatarChange?.(mediaId, upload.previewUrl);
            }
          }}
          onUploadingChange={onAvatarUploadingChange}
          previewUrl={visibleAvatarUrl}
          size="lg"
        />

        <h2
          className="mt-4 line-clamp-2 w-full break-words text-lg font-bold text-foreground"
          title={displayName}
        >
          {displayProfileValue(displayName)}
        </h2>
        <p className="mt-1 max-w-full truncate text-xs text-muted-foreground">
          {displayProfileValue(user.email)}
        </p>
      <p className="mt-2 text-xs font-semibold text-primary">
        {displayProfileValue(roleLabel)}
      </p>
      </div>
    </aside>
  );
}
