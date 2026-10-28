import { NextRequest, NextResponse } from "next/server";
import {
  generateMockAdminOverview,
  generateMockAdminRevenue,
  generateMockSupplierOverview,
  generateMockSupplierRevenue,
} from "@/mocks/analytics/dashboard-mock-data";
import type { AnalyticsGranularity } from "@/types/analytics";

type AnalyticsRouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: AnalyticsRouteContext) {
  const { path } = await context.params;
  const pathString = path.join("/");
  const { searchParams } = new URL(request.url);

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const granularity = (searchParams.get("granularity") as AnalyticsGranularity) || "day";

  try {
    switch (pathString) {
      case "overview":
        return NextResponse.json(generateMockAdminOverview(from, to), {
          headers: { "Cache-Control": "no-store", "X-DPRental-Mock": "true" },
        });

      case "revenue":
        return NextResponse.json(generateMockAdminRevenue(from, to, granularity), {
          headers: { "Cache-Control": "no-store", "X-DPRental-Mock": "true" },
        });

      case "me/overview":
        return NextResponse.json(generateMockSupplierOverview(from, to), {
          headers: { "Cache-Control": "no-store", "X-DPRental-Mock": "true" },
        });

      case "me/revenue":
        return NextResponse.json(generateMockSupplierRevenue(from, to, granularity), {
          headers: { "Cache-Control": "no-store", "X-DPRental-Mock": "true" },
        });

      default:
        return NextResponse.json(
          {
            status: 404,
            title: "Not Found",
            detail: `Endpoint mock '/api/mock/analytics/${pathString}' không tồn tại.`,
          },
          { status: 404 },
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Yêu cầu không hợp lệ";
    const isDateRangeError = message.startsWith("INVALID_DATE_RANGE");
    return NextResponse.json(
      {
        status: 400,
        title: isDateRangeError ? "INVALID_DATE_RANGE" : "Bad Request",
        detail: message,
      },
      { status: 400 },
    );
  }
}
