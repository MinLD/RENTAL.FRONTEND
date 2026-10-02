import { OrganizationsManagementTable } from "@/components/admin/organizations/organizations-management-table";
import {
  activateAdminOrganizationAction,
  approveAdminOrganizationAction,
  getAdminOrganizationDetailAction,
  getAdminOrganizationsAction,
  rejectAdminOrganizationAction,
  suspendAdminOrganizationAction,
} from "@/services/actions/admin-organizations-actions";

export default function OrganizationsPage() {
  return (
    <OrganizationsManagementTable
      approveOrganization={approveAdminOrganizationAction}
      activateOrganization={activateAdminOrganizationAction}
      fetchOrganizations={getAdminOrganizationsAction}
      fetchOrganizationDetail={getAdminOrganizationDetailAction}
      rejectOrganization={rejectAdminOrganizationAction}
      suspendOrganization={suspendAdminOrganizationAction}
    />
  );
}
