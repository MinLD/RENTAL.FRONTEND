import type { Metadata } from "next";
import { AdminPayoutsTable } from "@/components/admin/payouts/admin-payouts-table";
import { getAdminPayoutsAction } from "@/services/actions/admin-payouts-actions";

export const metadata: Metadata = {
  title: "Quyết toán tiền - Admin | DPRental",
  description: "Quản trị danh sách quyết toán và chi trả tiền thuê (payout) cho nhà cung cấp.",
};

export default function AdminPayoutsPage() {
  return <AdminPayoutsTable fetchPayouts={getAdminPayoutsAction} />;
}
