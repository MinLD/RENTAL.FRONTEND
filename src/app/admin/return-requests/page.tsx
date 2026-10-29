import type { Metadata } from "next";
import { AdminReturnRequestsTable } from "@/components/admin/return-requests/admin-return-requests-table";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "Yêu cầu trả máy - Admin | DPRental",
  description: "Quản trị viên (Admin) xem và phân xử các yêu cầu trả thiết bị, xử lý bất đồng và quá hạn 24h.",
};

export default function AdminReturnRequestsPage() {
  return (
    <QueryProvider>
      <AdminReturnRequestsTable />
    </QueryProvider>
  );
}
