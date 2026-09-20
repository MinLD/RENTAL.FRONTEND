import { NextResponse } from "next/server";

import {
  mockRequestPasswordReset,
  MockApiError,
} from "@/mocks/auth/password-reset";
import type { RequestPasswordResetRequest } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestPasswordResetRequest;
    const response = await mockRequestPasswordReset(body);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof MockApiError) {
      return NextResponse.json(
        { detail: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { detail: "Không thể gửi mã xác thực." },
      { status: 500 },
    );
  }
}
