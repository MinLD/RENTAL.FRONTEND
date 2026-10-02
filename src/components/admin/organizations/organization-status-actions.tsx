import { Check, LockKeyhole, UnlockKeyhole, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ORGANIZATION_STATUS } from "@/types/organization";

type OrganizationStatusAction = {
  disabled: boolean;
  Icon: typeof Check;
  label: string;
  onClick?: () => void;
};

export function OrganizationStatusActions({
  iconOnly = false,
  isApproving = false,
  isActivating = false,
  isRejecting = false,
  isSuspending = false,
  onActivate,
  onApprove,
  onReject,
  onSuspend,
  status,
}: {
  iconOnly?: boolean;
  isActivating?: boolean;
  isApproving?: boolean;
  isRejecting?: boolean;
  isSuspending?: boolean;
  onActivate?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onSuspend?: () => void;
  status: number;
}) {
  const actions: OrganizationStatusAction[] =
    status === ORGANIZATION_STATUS.pending
      ? [
          {
            disabled: !onApprove || isApproving,
            label: "Duyệt hồ sơ",
            Icon: Check,
            onClick: onApprove,
          },
          {
            disabled: !onReject || isRejecting,
            label: "Từ chối hồ sơ",
            Icon: X,
            onClick: onReject,
          },
        ]
      : status === ORGANIZATION_STATUS.active
        ? [
            {
              disabled: !onSuspend || isSuspending,
              label: "Tạm khóa tổ chức",
              Icon: LockKeyhole,
              onClick: onSuspend,
            },
          ]
        : status === ORGANIZATION_STATUS.suspended
          ? [
              {
                disabled: !onActivate || isActivating,
                label: "Mở khóa tổ chức",
                Icon: UnlockKeyhole,
                onClick: onActivate,
              },
            ]
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
      variant={"default"}
    >
      <Icon className="size-4" />
      {!iconOnly
        ? isApproving && label === "Duyệt hồ sơ"
          ? "Đang duyệt..."
          : isRejecting && label === "Từ chối hồ sơ"
            ? "Đang từ chối..."
            : isSuspending && label === "Tạm khóa tổ chức"
              ? "Đang tạm khóa..."
              : isActivating && label === "Mở khóa tổ chức"
                ? "Đang mở khóa..."
                : label
        : null}
    </Button>
  ));
}
