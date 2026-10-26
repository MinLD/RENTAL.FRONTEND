import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrdersManagementTable } from "@/components/own/orders/orders-management-table";
import { getCurrentUser } from "@/services/session-service";

export const metadata: Metadata = { title: "Quản lý đơn thuê" };

export default async function OwnOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=%2Fown%2Forders");
  return <OrdersManagementTable userId={user.id} />;
}
