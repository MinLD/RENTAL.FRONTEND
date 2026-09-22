import { NextRequest, NextResponse } from "next/server";

import { buildPublicBackendApiUrl } from "@/services/backend-api";
import { getFrontendOrigin } from "@/services/frontend-origin";

const GOOGLE_LOGIN_ENDPOINT = "/api/v1/auth/google/login";

function getSafeReturnUrl(request: NextRequest) {
  const returnUrl = request.nextUrl.searchParams.get("returnUrl");

  if (!returnUrl) {
    return "/";
  }

  try {
    const frontendOrigin = getFrontendOrigin(request.nextUrl.origin);
    const parsedReturnUrl = new URL(returnUrl, frontendOrigin);

    if (parsedReturnUrl.origin !== frontendOrigin) {
      return "/";
    }

    return `${parsedReturnUrl.pathname}${parsedReturnUrl.search}${parsedReturnUrl.hash}`;
  } catch {
    return "/";
  }
}

export function GET(request: NextRequest) {
  const frontendOrigin = getFrontendOrigin(request.nextUrl.origin);
  const frontendReturnUrl = new URL(
    getSafeReturnUrl(request),
    frontendOrigin,
  );
  const backendGoogleLoginUrl = new URL(
    buildPublicBackendApiUrl(GOOGLE_LOGIN_ENDPOINT),
  );
  backendGoogleLoginUrl.searchParams.set("returnUrl", frontendReturnUrl.toString());

  return NextResponse.redirect(backendGoogleLoginUrl);
}
