import { Badge } from "@/components/ui/badge";
import { ORGANIZATION_STATUS } from "@/types/organization";
import { getOrganizationStatusLabel } from "@/utils/organization";

export function OrganizationStatusBadge({ status }: { status: number }) {
  const variant = status === ORGANIZATION_STATUS.pending
    ? "warning"
    : status === ORGANIZATION_STATUS.active
      ? "success"
      : status === ORGANIZATION_STATUS.rejected
        ? "destructive"
        : "muted";

  return <Badge variant={variant}>{getOrganizationStatusLabel(status)}</Badge>;
}
