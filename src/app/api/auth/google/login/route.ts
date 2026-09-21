import { NextRequest, NextResponse } from "next/server";

import { buildBackendApiUrl } from "@/services/backend-api";

const GOOGLE_LOGIN_ENDPOINT = "/api/v1/auth/google/login";

function getSafeReturnUrl(request: NextRequest) {
  const returnUrl = request.nextUrl.searchParams.get("returnUrl");

  if (!returnUrl) {
    return "/";
  }

  try {
    const parsedReturnUrl = new URL(returnUrl, request.nextUrl.origin);

    if (parsedReturnUrl.origin !== request.nextUrl.origin) {
      return "/";
    }

    return `${parsedReturnUrl.pathname}${parsedReturnUrl.search}${parsedReturnUrl.hash}`;
  } catch {
    return "/";
  }
}

export function GET(request: NextRequest) {
  const frontendReturnUrl = new URL(
    getSafeReturnUrl(request),
    request.nextUrl.origin,
  );
  const backendGoogleLoginUrl = new URL(buildBackendApiUrl(GOOGLE_LOGIN_ENDPOINT));
  backendGoogleLoginUrl.searchParams.set("returnUrl", frontendReturnUrl.toString());

  return NextResponse.redirect(backendGoogleLoginUrl);
}
