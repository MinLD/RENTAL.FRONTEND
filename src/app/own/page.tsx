import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { SupplierDashboardView } from "@/components/own/dashboard/supplier-dashboard-view";
import {
  getSupplierAnalyticsOverviewServer,
  getSupplierAnalyticsRevenueServer,
  getSupplierListingStatisticsServer,
} from "@/services/analytics-server-service";
import { getDefaultAnalyticsDateRange } from "@/utils/analytics";
import { getCurrentUser } from "@/services/session-service";

export const metadata: Metadata = {
  title: "Dashboard Nhà cung cấp | DPRental",
  description: "Tổng quan kinh doanh, doanh số cho thuê thiết bị và tiền nhận Payout.",
};

export default async function OwPage() {
  const defaultRange = getDefaultAnalyticsDateRange();

  const [user, initialOverview, initialRevenue, initialListingStats] =
    await Promise.all([
      getCurrentUser(),
      getSupplierAnalyticsOverviewServer(defaultRange),
      getSupplierAnalyticsRevenueServer({ ...defaultRange, granularity: "day" }),
      getSupplierListingStatisticsServer(),
    ]);

  return (
    <QueryProvider>
      <SupplierDashboardView
        initialDateRange={defaultRange}
        initialListingStats={initialListingStats}
        initialOverview={initialOverview}
        initialRevenue={initialRevenue}
        userId={user?.id}
      />
    </QueryProvider>
  );
}
