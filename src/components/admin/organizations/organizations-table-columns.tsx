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
    width: 140,
    cell: (organization) => getOrganizationTypeLabel(organization.type),
  },
  {
    id: "status",
    header: "Trạng thái",
    width: 130,
    cell: (organization) => <OrganizationStatusBadge status={organization.status} />,
  },
  {
    id: "province",
    header: "Tỉnh/thành",
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
    width: 160,
    cell: (organization) => formatOrganizationDate(organization.createdAtUtc),
  },
];
