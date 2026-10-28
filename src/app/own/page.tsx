import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { SupplierDashboardView } from "@/components/own/dashboard/supplier-dashboard-view";
import {
  getSupplierAnalyticsOverviewServer,
  getSupplierAnalyticsRevenueServer,
  getSupplierListingStatisticsServer,
} from "@/services/analytics-server-service";

export const metadata: Metadata = {
  title: "Dashboard Nhà cung cấp | DPRental",
  description: "Tổng quan kinh doanh, doanh số cho thuê thiết bị và tiền nhận Payout.",
};

export default async function OwPage() {
  const [initialOverview, initialRevenue, initialListingStats] = await Promise.all([
    getSupplierAnalyticsOverviewServer(),
    getSupplierAnalyticsRevenueServer({ granularity: "day" }),
    getSupplierListingStatisticsServer(),
  ]);

  return (
    <QueryProvider>
      <SupplierDashboardView
        initialListingStats={initialListingStats}
        initialOverview={initialOverview}
        initialRevenue={initialRevenue}
      />
    </QueryProvider>
  );
}
