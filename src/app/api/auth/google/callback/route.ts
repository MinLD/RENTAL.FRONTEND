import { NextRequest, NextResponse } from "next/server";

import { buildBackendApiUrl } from "@/services/backend-api";
import { setAuthCookies } from "@/services/auth-cookie";
import { getFrontendOrigin } from "@/services/frontend-origin";
import type { GoogleExchangeResponse } from "@/types/auth";

const GOOGLE_EXCHANGE_ENDPOINT = "/api/v1/auth/google/exchange";
const GOOGLE_CALLBACK_PAGE = "/auth/callback/google";

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

function redirectToCallbackPage(
  request: NextRequest,
  params?: Record<string, string>,
) {
  const callbackPageUrl = new URL(
    GOOGLE_CALLBACK_PAGE,
    getFrontendOrigin(request.nextUrl.origin),
  );
  const returnUrl = getSafeReturnUrl(request);

  callbackPageUrl.searchParams.set("returnUrl", returnUrl);

  for (const [name, value] of Object.entries(params ?? {})) {
    callbackPageUrl.searchParams.set(name, value);
  }

  return NextResponse.redirect(callbackPageUrl);
}

export async function GET(request: NextRequest) {
  const backendError = request.nextUrl.searchParams.get("error");

  if (backendError) {
    return redirectToCallbackPage(request, {
      error: backendError,
    });
  }

  const ticket = request.nextUrl.searchParams.get("ticket");

  if (!ticket) {
    return redirectToCallbackPage(request, {
      error: "missing-ticket",
    });
  }

  const backendResponse = await fetch(buildBackendApiUrl(GOOGLE_EXCHANGE_ENDPOINT), {
    body: JSON.stringify({ ticket }),
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!backendResponse.ok) {
    return redirectToCallbackPage(request, {
      error: "exchange-failed",
    });
  }

  const tokens = (await backendResponse.json()) as GoogleExchangeResponse;

  if (!tokens.accessToken || !tokens.refreshToken) {
    return redirectToCallbackPage(request, {
      error: "invalid-token-response",
    });
  }

  const response = redirectToCallbackPage(request);

  setAuthCookies(response, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });

  return response;
}
