import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { AdminDashboardView } from "@/components/admin/dashboard/admin-dashboard-view";
import {
  getAdminAnalyticsOverview,
  getAdminAnalyticsRevenue,
} from "@/services/analytics-service";

export const metadata: Metadata = {
  title: "Dashboard Tổng quan - Admin | DPRental",
  description: "Trang tổng quan quản trị số liệu, doanh số GMV và phí sàn DPRental.",
};

export default async function AdminPage() {
  let initialOverview = null;
  let initialRevenue = null;

  try {
    [initialOverview, initialRevenue] = await Promise.all([
      getAdminAnalyticsOverview(),
      getAdminAnalyticsRevenue({ granularity: "day" }),
    ]);
  } catch {
    // Nếu SSR gặp sự cố, client-side React Query sẽ tiếp tục nạp lại
  }

  return (
    <QueryProvider>
      <AdminDashboardView
        initialOverview={initialOverview}
        initialRevenue={initialRevenue}
      />
    </QueryProvider>
  );
}
