import { NextResponse } from "next/server";

import {
  mockResetPassword,
  MockApiError,
} from "@/mocks/auth/password-reset";
import type { ResetPasswordRequest } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetPasswordRequest;
    await mockResetPassword(body);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof MockApiError) {
      return NextResponse.json(
        { detail: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { detail: "Không thể cập nhật mật khẩu." },
      { status: 500 },
    );
  }
}
