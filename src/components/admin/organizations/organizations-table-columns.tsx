import type { DataTableColumn } from "@/components/data-table";
import { OrganizationStatusBadge } from "@/components/organization/organization-status-badge";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminOrganizationSummary } from "@/types/admin-organizations";
import {
  formatOrganizationDate,
  getOrganizationInitials,
  getOrganizationTypeLabel,
} from "@/utils/organization";

export const organizationColumns: DataTableColumn<AdminOrganizationSummary>[] = [
  {
    id: "logo",
    header: "Logo",
    width: 64,
    skeleton: <Skeleton className="size-10 rounded-full" />,
    cell: (organization) => (
      <AvatarWithSkeleton
        alt={organization.name ?? "Logo tổ chức"}
        className="size-10 rounded-full bg-muted"
        fallback={getOrganizationInitials(organization.name)}
        fallbackClassName="rounded-full text-xs font-bold"
        src={organization.logoUrl}
      />
    ),
  },
  {
    id: "name",
    header: "Tên tổ chức",
    width: 220,
    cell: (organization) => (
      <span className="block truncate font-semibold" title={organization.name ?? undefined}>
        {organization.name || "Chưa có tên"}
      </span>
    ),
  },
  {
    id: "slug",
    header: "Slug",
    width: 190,
    cell: (organization) => (
      <span className="block truncate text-muted-foreground" title={organization.slug ?? undefined}>
        {organization.slug || "—"}
      </span>
    ),
  },
  {
    id: "type",
    header: "Loại tổ chức",
    minWidth: 130,
    width: 140,
    cell: (organization) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {getOrganizationTypeLabel(organization.type)}
      </span>
    ),
  },
  {
    id: "status",
    header: "Trạng thái",
    minWidth: 120,
    width: 130,
    cell: (organization) => <OrganizationStatusBadge status={organization.status} />,
  },
  {
    id: "province",
    header: "Tỉnh/thành",
    minWidth: 140,
    width: 150,
    cell: (organization) => (
      <span className="block truncate text-muted-foreground" title={organization.province ?? undefined}>
        {organization.province || "—"}
      </span>
    ),
  },
  {
    id: "createdAtUtc",
    header: "Ngày tạo",
    minWidth: 170,
    width: 180,
    cell: (organization) => (
      <span className="whitespace-nowrap font-medium text-muted-foreground">
        {formatOrganizationDate(organization.createdAtUtc)}
      </span>
    ),
  },
];
