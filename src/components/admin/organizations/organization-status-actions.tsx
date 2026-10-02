import { Check, LockKeyhole, UnlockKeyhole, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ORGANIZATION_STATUS } from "@/types/organization";

// Only the GET endpoints are connected in this first implementation step.
export function OrganizationStatusActions({
  iconOnly = false,
  status,
}: {
  iconOnly?: boolean;
  status: number;
}) {
  const actions = status === ORGANIZATION_STATUS.pending
    ? [
        { label: "Duyệt hồ sơ", Icon: Check },
        { label: "Từ chối hồ sơ", Icon: X },
      ]
    : status === ORGANIZATION_STATUS.active
      ? [{ label: "Tạm khóa tổ chức", Icon: LockKeyhole }]
      : status === ORGANIZATION_STATUS.suspended
        ? [{ label: "Mở khóa tổ chức", Icon: UnlockKeyhole }]
        : [];

  return actions.map(({ label, Icon }) => (
    <Button
      aria-label={label}
      disabled
      key={label}
      size={iconOnly ? "icon" : "sm"}
      title={label}
      type="button"
      variant={iconOnly ? "ghost" : "secondary"}
    >
      <Icon className="size-4" />
      {!iconOnly ? label : null}
    </Button>
  ));
}
