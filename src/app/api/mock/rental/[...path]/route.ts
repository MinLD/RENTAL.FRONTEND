import { NextRequest } from "next/server";
import { handleMockRental } from "../mock-handler";

type MockRentalRouteContext = {
  params: Promise<{ path: string[] }>;
};

async function dispatch(request: NextRequest, context: MockRentalRouteContext) {
  const { path } = await context.params;
  return handleMockRental(request, `/api/v1/rental/${path.join("/")}`);
}

export const GET = dispatch;
export const POST = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
