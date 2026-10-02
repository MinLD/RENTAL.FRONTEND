import { Check, LockKeyhole, UnlockKeyhole, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ORGANIZATION_STATUS } from "@/types/organization";

export function OrganizationStatusActions({
  iconOnly = false,
  isApproving = false,
  onApprove,
  status,
}: {
  iconOnly?: boolean;
  isApproving?: boolean;
  onApprove?: () => void;
  status: number;
}) {
  const actions = status === ORGANIZATION_STATUS.pending
    ? [
        { disabled: !onApprove || isApproving, label: "Duyệt hồ sơ", Icon: Check, onClick: onApprove },
        { disabled: true, label: "Từ chối hồ sơ", Icon: X },
      ]
    : status === ORGANIZATION_STATUS.active
      ? [{ disabled: true, label: "Tạm khóa tổ chức", Icon: LockKeyhole }]
      : status === ORGANIZATION_STATUS.suspended
        ? [{ disabled: true, label: "Mở khóa tổ chức", Icon: UnlockKeyhole }]
        : [];

  return actions.map(({ disabled, label, Icon, onClick }) => (
    <Button
      aria-label={label}
      disabled={disabled}
      key={label}
      onClick={onClick}
      size={iconOnly ? "icon" : "sm"}
      title={label}
      type="button"
      variant={iconOnly ? "ghost" : "secondary"}
    >
      <Icon className="size-4" />
      {!iconOnly ? (isApproving && label === "Duyệt hồ sơ" ? "Đang duyệt..." : label) : null}
    </Button>
  ));
}
