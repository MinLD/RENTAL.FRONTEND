import type { Metadata } from "next";
import { AdminRefundsTable } from "@/components/admin/refunds/admin-refunds-table";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "Yêu cầu hoàn tiền - Admin | DPRental",
  description: "Quản trị viên (Admin) xem các đơn yêu cầu hoàn tiền để chuyển khoản cho người thuê.",
};

export default function AdminRefundsPage() {
  return (
    <QueryProvider>
      <AdminRefundsTable />
    </QueryProvider>
  );
}
