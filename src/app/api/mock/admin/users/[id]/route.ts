import { NextResponse } from "next/server";

import { getMockUsersErrorResponse } from "@/app/api/mock/admin/users/_utils";
import { mockDeleteUser, mockUpdateUser } from "@/mocks/admin/users";
import type { UpdateAdminUserRequest } from "@/types/admin-users";

type UserRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: UserRouteContext) {
  try {
    const { id } = await context.params;
    await mockDeleteUser(decodeURIComponent(id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return getMockUsersErrorResponse(error, "Không thể xóa user.");
  }
}

export async function PUT(request: Request, context: UserRouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateAdminUserRequest;
    const response = await mockUpdateUser(decodeURIComponent(id), body);

    return NextResponse.json(response);
  } catch (error) {
    return getMockUsersErrorResponse(error, "Không thể cập nhật user.");
  }
}
