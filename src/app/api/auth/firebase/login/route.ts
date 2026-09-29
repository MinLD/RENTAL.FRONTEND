import { NextResponse } from "next/server";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { setAuthCookies } from "@/services/auth-cookie";
import { buildBackendApiUrl } from "@/services/backend-api";
import type { FirebaseLoginResponse } from "@/types/auth";

export async function POST(request: Request) {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Payload đăng nhập Firebase không hợp lệ." },
      { status: 400 },
    );
  }

  if (
    !requestBody ||
    typeof requestBody !== "object" ||
    !("idToken" in requestBody) ||
    typeof requestBody.idToken !== "string" ||
    !requestBody.idToken.trim()
  ) {
    return NextResponse.json(
      { detail: "Thiếu Firebase ID token." },
      { status: 400 },
    );
  }

  const backendResponse = await fetch(
    buildBackendApiUrl(API_ENDPOINTS.backend.auth.firebaseLogin),
    {
      body: JSON.stringify({ idToken: requestBody.idToken }),
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
  const responseHeaders = {
    "Cache-Control": "no-store",
    "Content-Type":
      backendResponse.headers.get("Content-Type") ?? "application/json",
  };

  if (!backendResponse.ok) {
    const responseBody = await backendResponse.text();

    return new NextResponse(responseBody || null, {
      headers: responseHeaders,
      status: backendResponse.status,
      statusText: backendResponse.statusText,
    });
  }

  const tokenPair = (await backendResponse.json()) as FirebaseLoginResponse;

  if (!tokenPair.accessToken || !tokenPair.refreshToken) {
    return NextResponse.json(
      { detail: "AuthService không trả đủ token đăng nhập." },
      {
        headers: {
          "Cache-Control": "no-store",
        },
        status: 502,
      },
    );
  }

  const response = NextResponse.json(
    { message: "Đăng nhập Firebase thành công." },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

  setAuthCookies(response, tokenPair);

  return response;
}
