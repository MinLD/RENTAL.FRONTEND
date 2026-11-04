import type { Metadata } from "next";
import { AdminRefundsTable } from "@/components/admin/refunds/admin-refunds-table";
export const metadata: Metadata = {
  title: "Hoàn tiền cọc - Admin | DPRental",
  description: "Quản trị viên (Admin) xem và quét mã QR chuyển khoản hoàn cọc cho người thuê.",
};

export default function AdminRefundsPage() {
  return <AdminRefundsTable />;
}
