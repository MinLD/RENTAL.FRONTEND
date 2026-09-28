import { NextResponse } from "next/server";

import { getMockUsersErrorResponse } from "@/app/api/mock/admin/users/_utils";
import { mockDeleteUser } from "@/mocks/admin/users";

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
