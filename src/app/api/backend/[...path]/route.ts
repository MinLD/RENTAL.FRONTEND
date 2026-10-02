import { NextRequest, NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/config/api-endpoints";

import { buildBackendApiUrl } from "@/services/backend-api";
import {
  clearAuthCookies,
  copyAuthCookies,
  mergeAuthCookiesIntoCookieHeader,
} from "@/services/auth-cookie";
import {
  isAuthRefreshEndpoint,
  refreshBackendSession,
} from "@/services/auth-refresh";

type BackendProxyContext = {
  params: Promise<{
    path: string[];
  }>;
};

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "content-type",
  "cookie",
  "Idempotency-Key",
];
const BODYLESS_RESPONSE_STATUSES = new Set([204, 205, 304]);

function buildForwardedHeaders(request: NextRequest, cookieHeader?: string) {
  const headers = new Headers();

  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  return headers;
}

function createProxyResponse(backendResponse: Response, preventCaching = false) {
  const responseHeaders = new Headers();
  const contentType = backendResponse.headers.get("content-type");

  if (preventCaching) {
    responseHeaders.set("Cache-Control", "private, no-store");
  }

  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  if (BODYLESS_RESPONSE_STATUSES.has(backendResponse.status)) {
    return Promise.resolve(
      new NextResponse(null, {
        headers: responseHeaders,
        status: backendResponse.status,
        statusText: backendResponse.statusText,
      }),
    );
  }

  return backendResponse.arrayBuffer().then(
    (responseBody) =>
      new NextResponse(responseBody, {
        headers: responseHeaders,
        status: backendResponse.status,
        statusText: backendResponse.statusText,
      }),
  );
}

async function proxyBackendRequest(
  request: NextRequest,
  context: BackendProxyContext,
) {
  const { path } = await context.params;
  const backendPath = `/${path.join("/")}`;
  const createResponse = (response: Response) =>
    createProxyResponse(
      response,
      backendPath === API_ENDPOINTS.backend.currentUser.citizenId,
    );
  const backendUrl = new URL(buildBackendApiUrl(backendPath));
  backendUrl.search = request.nextUrl.search;

  const hasRequestBody = !["GET", "HEAD"].includes(request.method);
  const body = hasRequestBody ? await request.arrayBuffer() : undefined;

  const requestBackend = (cookieHeader?: string) =>
    fetch(backendUrl, {
      body,
      cache: "no-store",
      headers: buildForwardedHeaders(request, cookieHeader),
      method: request.method,
    });

  const backendResponse = await requestBackend();

  if (backendResponse.status !== 401 || isAuthRefreshEndpoint(backendPath)) {
    return createResponse(backendResponse);
  }

  const cookieHeader = request.headers.get("cookie");
  const refreshResponse = await refreshBackendSession(cookieHeader);

  if (!refreshResponse.ok) {
    const response = await createResponse(backendResponse);

    if (refreshResponse.status === 401) {
      clearAuthCookies(response);
    }

    return response;
  }

  const retryResponse = await requestBackend(
    mergeAuthCookiesIntoCookieHeader(cookieHeader, refreshResponse.headers),
  );
  const response = await createResponse(retryResponse);

  copyAuthCookies(refreshResponse.headers, response);

  return response;
}

export function GET(request: NextRequest, context: BackendProxyContext) {
  return proxyBackendRequest(request, context);
}

export function POST(request: NextRequest, context: BackendProxyContext) {
  return proxyBackendRequest(request, context);
}

export function PUT(request: NextRequest, context: BackendProxyContext) {
  return proxyBackendRequest(request, context);
}

export function PATCH(request: NextRequest, context: BackendProxyContext) {
  return proxyBackendRequest(request, context);
}

export function DELETE(request: NextRequest, context: BackendProxyContext) {
  return proxyBackendRequest(request, context);
}
