import { NextRequest, NextResponse } from "next/server";

import { buildBackendApiUrl } from "@/services/backend-api";

type BackendProxyContext = {
  params: Promise<{
    path: string[];
  }>;
};

const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "cookie"];

async function proxyBackendRequest(
  request: NextRequest,
  context: BackendProxyContext,
) {
  const { path } = await context.params;
  const backendPath = `/${path.join("/")}`;
  const backendUrl = new URL(buildBackendApiUrl(backendPath));
  backendUrl.search = request.nextUrl.search;

  const headers = new Headers();

  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  const hasRequestBody = !["GET", "HEAD"].includes(request.method);
  const body = hasRequestBody ? await request.arrayBuffer() : undefined;
  const backendResponse = await fetch(backendUrl, {
    body,
    cache: "no-store",
    headers,
    method: request.method,
  });
  const responseHeaders = new Headers();
  const contentType = backendResponse.headers.get("content-type");

  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  return new NextResponse(await backendResponse.arrayBuffer(), {
    headers: responseHeaders,
    status: backendResponse.status,
    statusText: backendResponse.statusText,
  });
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
