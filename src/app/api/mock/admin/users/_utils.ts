import { NextResponse } from "next/server";

import { MockAdminUsersApiError } from "@/mocks/admin/users";

export function getMockUsersErrorResponse(error: unknown, fallback: string) {
  if (error instanceof MockAdminUsersApiError) {
    return NextResponse.json(
      { detail: error.message },
      { status: error.status },
    );
  }

  return NextResponse.json({ detail: fallback }, { status: 500 });
}
