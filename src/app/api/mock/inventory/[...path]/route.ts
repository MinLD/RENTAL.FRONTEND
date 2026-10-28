import { NextRequest, NextResponse } from "next/server";
import { MOCK_INVENTORY_STATISTICS_SAMPLE } from "@/mocks/analytics/dashboard-mock-data";

type InventoryRouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(
  _request: NextRequest,
  context: InventoryRouteContext,
) {
  const { path } = await context.params;
  const pathString = path.join("/");

  if (pathString === "equipment-listings/statistics") {
    return NextResponse.json(MOCK_INVENTORY_STATISTICS_SAMPLE, {
      headers: { "Cache-Control": "no-store", "X-DPRental-Mock": "true" },
    });
  }

  return NextResponse.json(
    {
      status: 404,
      title: "Not Found",
      detail: `Endpoint mock '/api/mock/inventory/${pathString}' không tồn tại.`,
    },
    { status: 404 },
  );
}
