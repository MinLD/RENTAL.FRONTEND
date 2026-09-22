import { NextResponse } from "next/server";

import { clearAuthCookies, copyAuthCookies } from "@/services/auth-cookie";
import { refreshBackendSession } from "@/services/auth-refresh";

export async function POST(request: Request) {
  const backendResponse = await refreshBackendSession(
    request.headers.get("cookie"),
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
