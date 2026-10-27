import { Button } from "@/components/ui/button";
import { ORGANIZATION_STATUS } from "@/types/organization";

type OrganizationStatusAction = {
  disabled: boolean;
  isLoading: boolean;
  label: string;
  loadingLabel: string;
  onClick?: () => void;
};

export function OrganizationStatusActions({
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
            isLoading: isApproving,
            label: "Duyệt",
            loadingLabel: "Đang duyệt...",
            onClick: onApprove,
          },
          {
            disabled: !onReject || isRejecting,
            isLoading: isRejecting,
            label: "Từ chối",
            loadingLabel: "Đang từ chối...",
            onClick: onReject,
          },
        ]
      : status === ORGANIZATION_STATUS.active
        ? [
            {
              disabled: !onSuspend || isSuspending,
              isLoading: isSuspending,
              label: "Tạm khóa",
              loadingLabel: "Đang tạm khóa...",
              onClick: onSuspend,
            },
          ]
        : status === ORGANIZATION_STATUS.suspended
          ? [
              {
                disabled: !onActivate || isActivating,
                isLoading: isActivating,
                label: "Mở khóa",
                loadingLabel: "Đang mở khóa...",
                onClick: onActivate,
              },
            ]
          : [];

  return actions.map(
    ({ disabled, label, loadingLabel, isLoading, onClick }) => (
      <Button
        aria-label={label}
        disabled={disabled}
        key={label}
        onClick={onClick}
        size="sm"
        title={label}
        type="button"
        variant="default"
      >
        {isLoading ? loadingLabel : label}
      </Button>
    ),
  );
}
