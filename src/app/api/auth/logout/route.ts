import { NextResponse } from "next/server";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { buildBackendApiUrl } from "@/services/backend-api";
import { clearAuthCookies } from "@/services/auth-cookie";

export async function POST(request: Request) {
  const backendResponse = await fetch(
    buildBackendApiUrl(API_ENDPOINTS.backend.auth.logout),
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(request.headers.get("cookie")
          ? { Cookie: request.headers.get("cookie") as string }
          : {}),
      },
      method: "POST",
    },
  );

  if (!backendResponse.ok && backendResponse.status >= 500) {
    const responseBody = await backendResponse.text();

    return new NextResponse(responseBody || null, {
      headers: {
        "Content-Type":
          backendResponse.headers.get("Content-Type") ?? "application/json",
      },
      status: backendResponse.status,
      statusText: backendResponse.statusText,
    });
  }

  const response = new NextResponse(null, { status: 204 });
  clearAuthCookies(response);

  return response;
}
