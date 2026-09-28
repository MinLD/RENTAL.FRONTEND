import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MediaAvatarUpload } from "@/components/media/media-avatar-upload";
import { Badge } from "@/components/ui/badge";
import type { AdminUserRow } from "@/types/admin-users";
import { cn } from "@/utils/cn";

import { getInitials } from "./users-table-utils";

type UserDetailDrawerProps = {
  onOpenChange: (open: boolean) => void;
  user: AdminUserRow | null;
};

export function UserDetailDrawer({
  onOpenChange,
  user,
}: UserDetailDrawerProps) {
  return (
    <Sheet open={Boolean(user)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-md">
        {user ? (
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-border p-6">
              <SheetTitle className="truncate">{user.name}</SheetTitle>
              <SheetDescription className="truncate">
                {user.email}
              </SheetDescription>
            </SheetHeader>
            <UserDetail className="p-6" user={user} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function UserDetail({
  className,
  user,
}: {
  className?: string;
  user: AdminUserRow;
}) {
  const fields = [
    ["ID", user.id],
    ["Họ tên", user.name],
    ["Email", user.email],
    ["Số điện thoại", user.phone || "-"],
    ["Ngày tạo", formatDateTime(user.createdAtUtc)],
    ["Trạng thái", user.status === "active" ? "Hoạt động" : "Tạm khóa"],
  ];

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="flex flex-col items-center rounded border border-border bg-muted/40 p-5 text-center">
        <MediaAvatarUpload
          fallbackText={getInitials(user.name)}
          previewUrl={user.avatarUrl}
          size="xl"
        />
        <div className="mt-4 max-w-full">
          <p className="truncate text-sm font-bold text-foreground">
            Ảnh đại diện
          </p>
        </div>
      </div>

      <dl className="grid gap-4">
        {fields.map(([label, value]) => (
          <div
            className="rounded border border-border bg-muted/40 p-3"
            key={label}
          >
            <dt className="text-xs font-semibold uppercase text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="rounded border border-border bg-muted/40 p-3">
        <div className="text-xs font-semibold uppercase text-muted-foreground">
          Global roles
        </div>
        {user.globalRoles?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {user.globalRoles.map((role) => (
              <Badge key={role} variant="muted">
                {role}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="mt-1 text-sm font-semibold text-foreground">-</div>
        )}
      </div>
    </div>
  );
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
