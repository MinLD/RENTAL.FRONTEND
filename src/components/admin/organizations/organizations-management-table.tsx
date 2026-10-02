"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useAdminOrganizationsController } from "@/hooks/use-admin-organizations-controller";
import type {
  AdminOrganizationDetail,
  AdminOrganizationSummary,
  AdminOrganizationsFilters,
} from "@/types/admin-organizations";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import { ORGANIZATION_STATUS_OPTIONS } from "@/utils/organization";

import { OrganizationDetailDrawer } from "./organization-detail-drawer";
import { OrganizationRejectDialog } from "./organization-reject-dialog";
import { OrganizationStatusActions } from "./organization-status-actions";
import { organizationColumns } from "./organizations-table-columns";

type OrganizationsManagementTableProps = {
  approveOrganization: (id: string) => Promise<AdminOrganizationDetail>;
  fetchOrganizations: (
    params: DataTableFetchParams<AdminOrganizationsFilters>,
  ) => Promise<DataTableFetchResult<AdminOrganizationSummary>>;
  fetchOrganizationDetail: (id: string) => Promise<AdminOrganizationDetail>;
  rejectOrganization: (id: string, reason: string) => Promise<AdminOrganizationDetail>;
};

export function OrganizationsManagementTable({
  approveOrganization,
  fetchOrganizations,
  fetchOrganizationDetail,
  rejectOrganization,
}: OrganizationsManagementTableProps) {
  const controller = useAdminOrganizationsController(fetchOrganizationDetail);
  const listRefreshRef = useRef<(() => void) | null>(null);
  const [approveTarget, setApproveTarget] = useState<
    AdminOrganizationDetail | AdminOrganizationSummary | null
  >(null);
  const [rejectTarget, setRejectTarget] = useState<
    AdminOrganizationDetail | AdminOrganizationSummary | null
  >(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  async function handleApproveConfirm() {
    if (!approveTarget) {
      return;
    }

    setIsApproving(true);

    try {
      const approvedOrganization = await approveOrganization(approveTarget.id);

      toast.success("Đã duyệt hồ sơ tổ chức.");
      controller.handleOrganizationUpdated(approvedOrganization);
      listRefreshRef.current?.();
      setApproveTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể duyệt hồ sơ tổ chức.",
      );
    } finally {
      setIsApproving(false);
    }
  }

  async function handleRejectSubmit(reason: string) {
    if (!rejectTarget) {
      return;
    }

    setIsRejecting(true);

    try {
      const rejectedOrganization = await rejectOrganization(rejectTarget.id, reason);

      toast.success("Đã từ chối hồ sơ tổ chức.");
      controller.handleOrganizationUpdated(rejectedOrganization);
      listRefreshRef.current?.();
      setRejectTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể từ chối hồ sơ tổ chức.",
      );
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <DataTable<AdminOrganizationSummary, AdminOrganizationsFilters>
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={organizationColumns}
        description="Xem hồ sơ và quản lý các tổ chức trên nền tảng"
        emptyState="Không có tổ chức phù hợp."
        fetchData={fetchOrganizations}
        getRowId={(organization) => organization.id}
        initialPageSize={20}
        onRowDoubleClick={(organization) => {
          void controller.handleViewOrganization(organization);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        renderFilters={({ filters, refresh, setFilters }) => (
          <>
            <DataTableRefreshBridge
              onRefreshReady={(nextRefresh) => {
                listRefreshRef.current = nextRefresh;
              }}
              refresh={refresh}
            />
            <select
              aria-label="Lọc trạng thái tổ chức"
              className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-48"
              onChange={(event) => {
                const option = ORGANIZATION_STATUS_OPTIONS.find(
                  (item) => String(item.value) === event.target.value,
                );
                setFilters({ status: option?.value });
              }}
              value={filters.status === undefined ? "" : String(filters.status)}
            >
              <option value="">Tất cả trạng thái</option>
              {ORGANIZATION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        )}
        renderRowActions={(organization, { refresh }) => (
          <div className="flex justify-end gap-1">
            <Button
              aria-label="Xem chi tiết tổ chức"
              onClick={() => {
                void controller.handleViewOrganization(organization);
              }}
              size="icon"
              title="Xem chi tiết tổ chức"
              type="button"
              variant="ghost"
            >
              <Eye className="size-4" />
            </Button>
            <OrganizationStatusActions
              iconOnly
              isApproving={isApproving && approveTarget?.id === organization.id}
              isRejecting={isRejecting && rejectTarget?.id === organization.id}
              onApprove={() => {
                listRefreshRef.current = refresh;
                setApproveTarget(organization);
              }}
              onReject={() => {
                listRefreshRef.current = refresh;
                setRejectTarget(organization);
              }}
              status={organization.status}
            />
          </div>
        )}
        searchMaxLength={200}
        searchPlaceholder="Tìm theo tên hoặc slug..."
        showCsvExport={false}
        title="Danh sách tổ chức"
      />

      <OrganizationDetailDrawer
        error={controller.detailError}
        isApproving={isApproving && approveTarget?.id === controller.detailOrganization?.id}
        isLoading={controller.isLoadingDetail}
        isRejecting={isRejecting && rejectTarget?.id === controller.detailOrganization?.id}
        onApprove={setApproveTarget}
        onOpenChange={(open) => {
          if (!open) controller.closeDetail();
        }}
        onRefresh={controller.refreshDetail}
        onReject={setRejectTarget}
        open={Boolean(controller.selectedOrganization)}
        organization={controller.detailOrganization}
        selectedName={controller.selectedOrganization?.name}
      />

      <ConfirmDialog
        confirmLabel="Duyệt hồ sơ"
        description={`Tổ chức "${approveTarget?.name || "này"}" sẽ chuyển sang trạng thái Hoạt động sau khi được duyệt.`}
        icon={<CheckCircle2 className="size-5 text-green-600" />}
        isSubmitting={isApproving}
        onConfirm={() => {
          void handleApproveConfirm();
        }}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(null);
        }}
        open={Boolean(approveTarget)}
        submittingLabel="Đang duyệt..."
        title="Duyệt hồ sơ tổ chức?"
      />

      <OrganizationRejectDialog
        isSubmitting={isRejecting}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        onSubmit={(reason) => {
          void handleRejectSubmit(reason);
        }}
        open={Boolean(rejectTarget)}
        organizationName={rejectTarget?.name}
      />
    </div>
  );
}

function DataTableRefreshBridge({
  onRefreshReady,
  refresh,
}: {
  onRefreshReady: (refresh: () => void) => void;
  refresh: () => void;
}) {
  useEffect(() => {
    onRefreshReady(refresh);
  }, [onRefreshReady, refresh]);

  return null;
}
