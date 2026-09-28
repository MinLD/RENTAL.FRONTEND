import { NextResponse } from "next/server";

import { getMockUsersErrorResponse } from "@/app/api/mock/admin/users/_utils";
import { mockCreateUser } from "@/mocks/admin/users";
import type { CreateAdminUserRequest } from "@/types/admin-users";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateAdminUserRequest;
    const response = await mockCreateUser(body);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return getMockUsersErrorResponse(error, "Không thể tạo user.");
  }
}
