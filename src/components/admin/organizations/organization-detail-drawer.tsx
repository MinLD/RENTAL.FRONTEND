"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import type { ApiResult } from "@/services/api-error";

import { FormDrawer } from "@/components/forms/form-drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AdminOrganizationDetail,
  AdminOrganizationHistoryResult,
} from "@/types/admin-organizations";
import { OrganizationDetails } from "./organization-details";
import { OrganizationHistoryPanel } from "./organization-history-panel";
import { OrganizationStatusActions } from "./organization-status-actions";

type OrganizationDetailDrawerProps = {
  error: string | null;
  fetchHistory: (
    id: string,
    params: { page?: number; pageSize?: number; search?: string },
  ) => Promise<ApiResult<AdminOrganizationHistoryResult>>;
  isActivating?: boolean;
  isApproving?: boolean;
  isLoading: boolean;
  isRejecting?: boolean;
  isSuspending?: boolean;
  onActivate?: (organization: AdminOrganizationDetail) => void;
  onApprove?: (organization: AdminOrganizationDetail) => void;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onReject?: (organization: AdminOrganizationDetail) => void;
  onSuspend?: (organization: AdminOrganizationDetail) => void;
  open: boolean;
  organization: AdminOrganizationDetail | null;
  selectedName?: string | null;
};

export function OrganizationDetailDrawer({
  error,
  fetchHistory,
  isActivating = false,
  isApproving = false,
  onActivate,
  onApprove,
  isLoading,
  isRejecting = false,
  isSuspending = false,
  onOpenChange,
  onRefresh,
  onReject,
  onSuspend,
  open,
  organization,
  selectedName,
}: OrganizationDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("detail");

  return (
    <FormDrawer
      activeTab={activeTab}
      bodyClassName={activeTab === "history" ? "overflow-hidden" : undefined}
      className="sm:max-w-2xl"
      description={selectedName || "Thông tin doanh nghiệp và hồ sơ đăng ký"}
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button disabled={isLoading} onClick={onRefresh} size="sm" type="button" variant="ghost">
            <RefreshCw className={isLoading ? "size-4 animate-spin" : "size-4"} />
            Tải lại
          </Button>
          {organization ? (
            <OrganizationStatusActions
              isActivating={isActivating}
              isApproving={isApproving}
              isRejecting={isRejecting}
              isSuspending={isSuspending}
              onActivate={() => onActivate?.(organization)}
              onApprove={() => onApprove?.(organization)}
              onReject={() => onReject?.(organization)}
              onSuspend={() => onSuspend?.(organization)}
              status={organization.status}
            />
          ) : null}
          <Button onClick={() => onOpenChange(false)} size="sm" type="button" variant="secondary">
            Đóng
          </Button>
        </div>
      }
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setActiveTab("detail");
        }

        onOpenChange(nextOpen);
      }}
      onTabChange={setActiveTab}
      open={open}
      tabs={[
        { label: "Chi tiết", value: "detail" },
        { label: "Lịch sử", value: "history" },
      ]}
      title="Chi tiết tổ chức"
    >
      {isLoading ? (
        <div aria-label="Đang tải hồ sơ tổ chức" aria-busy="true" className="space-y-6">
          <Skeleton className="mx-auto size-20 rounded-lg" />
          {Array.from({ length: 6 }, (_, index) => (
            <div className="space-y-2" key={index}>
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="space-y-4 rounded border border-error/20 bg-error/5 p-4" role="alert">
          <p className="text-sm text-error">{error}</p>
          <Button onClick={onRefresh} size="sm" type="button" variant="secondary">Thử lại</Button>
        </div>
      ) : activeTab === "history" && organization ? (
        <OrganizationHistoryPanel
          fetchHistory={fetchHistory}
          organizationId={organization.id}
        />
      ) : organization ? (
        <OrganizationDetails onRefresh={onRefresh} organization={organization} />
      ) : null}
    </FormDrawer>
  );
}
