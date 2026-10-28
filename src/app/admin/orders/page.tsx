import type { Metadata } from "next";
import { AdminOrdersTable } from "@/components/admin/orders/admin-orders-table";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "Quản lý đơn thuê - Admin | DPRental",
  description: "Tra cứu và quản trị toàn bộ đơn thuê thiết bị trên sàn DPRental.",
};

export default function AdminOrdersPage() {
  return (
    <QueryProvider>
      <AdminOrdersTable />
    </QueryProvider>
  );
}
