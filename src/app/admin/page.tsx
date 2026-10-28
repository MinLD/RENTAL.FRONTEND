import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { AdminDashboardView } from "@/components/admin/dashboard/admin-dashboard-view";
import {
  getAdminAnalyticsOverviewServer,
  getAdminAnalyticsRevenueServer,
} from "@/services/analytics-server-service";

export const metadata: Metadata = {
  title: "Dashboard Tổng quan - Admin | DPRental",
  description: "Trang tổng quan quản trị số liệu, doanh số GMV và phí sàn DPRental.",
};

export default async function AdminPage() {
  const [initialOverview, initialRevenue] = await Promise.all([
    getAdminAnalyticsOverviewServer(),
    getAdminAnalyticsRevenueServer({ granularity: "day" }),
  ]);

  return (
    <QueryProvider>
      <AdminDashboardView
        initialOverview={initialOverview}
        initialRevenue={initialRevenue}
      />
    </QueryProvider>
  );
}
