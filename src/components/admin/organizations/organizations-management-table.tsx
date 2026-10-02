"use client";

import { Eye } from "lucide-react";

import { DataTable } from "@/components/data-table";
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
import { OrganizationStatusActions } from "./organization-status-actions";
import { organizationColumns } from "./organizations-table-columns";

type OrganizationsManagementTableProps = {
  fetchOrganizations: (
    params: DataTableFetchParams<AdminOrganizationsFilters>,
  ) => Promise<DataTableFetchResult<AdminOrganizationSummary>>;
  fetchOrganizationDetail: (id: string) => Promise<AdminOrganizationDetail>;
};

export function OrganizationsManagementTable({
  fetchOrganizations,
  fetchOrganizationDetail,
}: OrganizationsManagementTableProps) {
  const controller = useAdminOrganizationsController(fetchOrganizationDetail);

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
        renderFilters={({ filters, setFilters }) => (
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
        )}
        renderRowActions={(organization) => (
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
            <OrganizationStatusActions iconOnly status={organization.status} />
          </div>
        )}
        searchMaxLength={200}
        searchPlaceholder="Tìm theo tên hoặc slug..."
        showCsvExport={false}
        title="Danh sách tổ chức"
      />

      <OrganizationDetailDrawer
        error={controller.detailError}
        isLoading={controller.isLoadingDetail}
        onOpenChange={(open) => {
          if (!open) controller.closeDetail();
        }}
        onRefresh={controller.refreshDetail}
        open={Boolean(controller.selectedOrganization)}
        organization={controller.detailOrganization}
        selectedName={controller.selectedOrganization?.name}
      />
    </div>
  );
}
