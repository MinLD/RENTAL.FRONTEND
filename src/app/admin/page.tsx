import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { AdminDashboardView } from "@/components/admin/dashboard/admin-dashboard-view";
import {
  getAdminAnalyticsEquipmentServer,
  getAdminAnalyticsOrdersServer,
  getAdminAnalyticsOverviewServer,
  getAdminAnalyticsRevenueServer,
  getAdminAnalyticsSuppliersServer,
} from "@/services/analytics-server-service";
import { getDefaultAnalyticsDateRange } from "@/utils/analytics";
import { getCurrentUser } from "@/services/session-service";

export const metadata: Metadata = {
  title: "Dashboard Tổng quan - Admin | DPRental",
  description: "Trang tổng quan quản trị số liệu, doanh số GMV và phí sàn DPRental.",
};

export default async function AdminPage() {
  const defaultRange = getDefaultAnalyticsDateRange();

  const [
    user,
    initialOverview,
    initialRevenue,
    initialOrders,
    initialEquipment,
    initialSuppliers,
  ] = await Promise.all([
    getCurrentUser(),
    getAdminAnalyticsOverviewServer(defaultRange),
    getAdminAnalyticsRevenueServer({ ...defaultRange, granularity: "day" }),
    getAdminAnalyticsOrdersServer(defaultRange),
    getAdminAnalyticsEquipmentServer({ ...defaultRange, limit: 10 }),
    getAdminAnalyticsSuppliersServer({ ...defaultRange, page: 1, pageSize: 20 }),
  ]);

  return (
    <QueryProvider>
      <AdminDashboardView
        initialDateRange={defaultRange}
        initialOverview={initialOverview}
        initialRevenue={initialRevenue}
        initialOrders={initialOrders}
        initialEquipment={initialEquipment}
        initialSuppliers={initialSuppliers}
        userId={user?.id}
      />
    </QueryProvider>
  );
}
