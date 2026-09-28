import { NextRequest, NextResponse } from "next/server";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import { buildPublicBackendApiUrl } from "@/services/backend-api";
import { getFrontendOrigin } from "@/services/frontend-origin";

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
    buildPublicBackendApiUrl(API_ENDPOINTS.backend.auth.googleLogin),
  );
  backendGoogleLoginUrl.searchParams.set("returnUrl", frontendReturnUrl.toString());

  return NextResponse.redirect(backendGoogleLoginUrl);
}
