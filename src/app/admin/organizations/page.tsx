import { OrganizationsManagementTable } from "@/components/admin/organizations/organizations-management-table";
import {
  getAdminOrganizationDetailAction,
  getAdminOrganizationsAction,
} from "@/services/actions/admin-organizations-actions";

export default function OrganizationsPage() {
  return (
    <OrganizationsManagementTable
      fetchOrganizations={getAdminOrganizationsAction}
      fetchOrganizationDetail={getAdminOrganizationDetailAction}
    />
  );
}
