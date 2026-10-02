import { OrganizationsManagementTable } from "@/components/admin/organizations/organizations-management-table";
import {
  approveAdminOrganizationAction,
  getAdminOrganizationDetailAction,
  getAdminOrganizationsAction,
  rejectAdminOrganizationAction,
} from "@/services/actions/admin-organizations-actions";

export default function OrganizationsPage() {
  return (
    <OrganizationsManagementTable
      approveOrganization={approveAdminOrganizationAction}
      fetchOrganizations={getAdminOrganizationsAction}
      fetchOrganizationDetail={getAdminOrganizationDetailAction}
      rejectOrganization={rejectAdminOrganizationAction}
    />
  );
}
