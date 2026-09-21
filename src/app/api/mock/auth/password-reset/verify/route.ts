import { NextResponse } from "next/server";

import {
  mockVerifyPasswordResetCode,
  MockApiError,
} from "@/mocks/auth/password-reset";
import type { VerifyPasswordResetCodeRequest } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyPasswordResetCodeRequest;
    const response = await mockVerifyPasswordResetCode(body);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof MockApiError) {
      return NextResponse.json(
        { detail: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { detail: "Không thể xác thực mã." },
      { status: 500 },
    );
  }
}
