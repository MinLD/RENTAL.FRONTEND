import type { DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { ClickToCopy } from "@/components/ui/click-to-copy";
import type { AdminUserRow, AdminUserStatus } from "@/types/admin-users";

import { formatShortId } from "@/utils/string";

export const userColumns: DataTableColumn<AdminUserRow>[] = [
  {
    cell: (user) => (
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate font-semibold text-foreground">
          {user.name}
        </span>
      </div>
    ),
    header: "User",
    id: "user",
    minWidth: 220,
    width: 240,
  },
  {
    cell: (user) => (
      <ClickToCopy
        className="font-medium text-muted-foreground"
        text={user.email}
      />
    ),
    header: "Email",
    id: "email",
    minWidth: 260,
    width: 300,
  },
  {
    cell: (user) => (
      <ClickToCopy
        className="font-mono font-medium text-muted-foreground"
        display={formatShortId(user.id)}
        text={user.id}
      />
    ),
    header: "ID",
    id: "id",
    minWidth: 150,
    width: 160,
  },
  {
    cell: (user) => (
      <span className="block truncate font-medium text-muted-foreground">
        {formatDateTime(user.createdAtUtc)}
      </span>
    ),
    header: "Ngày tạo",
    id: "createdAt",
    minWidth: 180,
    width: 190,
  },
  {
    cell: (user) => (
      <span className="block truncate font-medium text-muted-foreground">
        {user.globalRoles?.length ? user.globalRoles.join(", ") : "-"}
      </span>
    ),
    header: "Vai trò",
    id: "roles",
    minWidth: 180,
    width: 220,
  },
  {
    cell: (user) => <UserStatusBadge status={user.status} />,
    header: "Trạng thái",
    id: "status",
    minWidth: 140,
    width: 160,
  },
];

function UserStatusBadge({ status }: { status: AdminUserStatus }) {
  if (status === "active") {
    return <Badge variant="success">Hoạt động</Badge>;
  }

  return <Badge variant="destructive">Tạm khóa</Badge>;
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
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
