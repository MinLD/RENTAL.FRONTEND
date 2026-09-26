import { CalendarDays, Camera, IdCard, Phone } from "lucide-react";
import type { ReactNode } from "react";

import type { AccountProfileInitialData } from "@/components/account/account-types";
import {
  displayProfileValue,
  formatDisplayDate,
  getUserInitials,
  maskIdentityNumber,
} from "@/components/account/account-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AuthUser } from "@/types/auth";

type AccountProfileSummaryProps = {
  initialProfile: AccountProfileInitialData;
  user: AuthUser;
};

export function AccountProfileSummary({
  initialProfile,
  user,
}: AccountProfileSummaryProps) {
  return (
    <aside className="self-start rounded-lg border border-border bg-background p-6 shadow-sm lg:sticky lg:top-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <Avatar className="h-24 w-24 bg-secondary text-secondary-foreground">
            {initialProfile.avatarUrl ? (
              <AvatarImage alt={user.name} src={initialProfile.avatarUrl} />
            ) : null}
            <AvatarFallback className="bg-secondary text-2xl font-bold text-secondary-foreground">
              {getUserInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <button
            aria-label="Cập nhật ảnh đại diện"
            className="absolute bottom-0 right-0 inline-flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
            type="button"
          >
            <Camera size={15} />
          </button>
        </div>

        <h2 className="mt-4 text-lg font-bold text-foreground">
          {displayProfileValue(user.name)}
        </h2>
        <p className="mt-1 max-w-full truncate text-xs text-muted-foreground">
          {displayProfileValue(user.email)}
        </p>
        <p className="mt-2 text-xs font-semibold text-primary">
          {displayProfileValue(initialProfile.roleLabel)}
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
