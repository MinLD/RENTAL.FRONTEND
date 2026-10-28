import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { SupplierDashboardView } from "@/components/own/dashboard/supplier-dashboard-view";
import {
  getSupplierAnalyticsOverview,
  getSupplierAnalyticsRevenue,
  getSupplierListingStatistics,
} from "@/services/analytics-service";

export const metadata: Metadata = {
  title: "Dashboard Nhà cung cấp | DPRental",
  description: "Tổng quan kinh doanh, doanh số cho thuê thiết bị và tiền nhận Payout.",
};

export default async function OwPage() {
  let initialOverview = null;
  let initialRevenue = null;
  let initialListingStats = null;

  try {
    [initialOverview, initialRevenue, initialListingStats] = await Promise.all([
      getSupplierAnalyticsOverview(),
      getSupplierAnalyticsRevenue({ granularity: "day" }),
      getSupplierListingStatistics(),
    ]);
  } catch {
    // Nếu SSR gặp sự cố, client-side React Query sẽ tự động nạp lại
  }

  return (
    <QueryProvider>
      <SupplierDashboardView
        initialOverview={initialOverview}
        initialRevenue={initialRevenue}
        initialListingStats={initialListingStats}
      />
    </QueryProvider>
  );
}
