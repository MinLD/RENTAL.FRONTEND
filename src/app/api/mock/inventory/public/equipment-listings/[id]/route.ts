import { NextResponse } from "next/server";

import {
  getMockPublicEquipmentListing,
  isPublicEquipmentDetailMockEnabled,
} from "@/mocks/inventory/equipment-listing";

export function GET() {
  if (!isPublicEquipmentDetailMockEnabled()) {
    return NextResponse.json(
      { detail: "Mock chi tiết thiết bị chưa được bật." },
      { status: 404 },
    );
  }
  return NextResponse.json(getMockPublicEquipmentListing(), {
    headers: { "Cache-Control": "no-store" },
  });
}
