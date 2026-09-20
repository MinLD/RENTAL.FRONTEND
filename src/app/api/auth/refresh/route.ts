import { NextResponse } from "next/server";

import { buildBackendApiUrl } from "@/services/backend-api";
import { clearAuthCookies, copyAuthCookies } from "@/services/auth-cookie";

export async function POST(request: Request) {
  const backendResponse = await fetch(
    buildBackendApiUrl("/api/v1/auth/refresh"),
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
  const responseBody = await backendResponse.text();
  const response = new NextResponse(responseBody || null, {
    headers: {
      "Content-Type":
        backendResponse.headers.get("Content-Type") ?? "application/json",
    },
    status: backendResponse.status,
    statusText: backendResponse.statusText,
  });

  if (backendResponse.ok) {
    copyAuthCookies(backendResponse.headers, response);
  }

  if (backendResponse.status === 401) {
    clearAuthCookies(response);
  }

  return response;
}
