import { NextResponse } from "next/server";

import { buildBackendApiUrl } from "@/services/backend-api";
import { copyAuthCookies } from "@/services/auth-cookie";

export async function POST(request: Request) {
  const backendResponse = await fetch(
    buildBackendApiUrl("/api/v1/auth/login"),
    {
      body: await request.text(),
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": request.headers.get("Content-Type") ?? "application/json",
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

  return response;
}
