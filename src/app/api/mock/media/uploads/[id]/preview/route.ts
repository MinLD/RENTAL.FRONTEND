import { NextResponse } from "next/server";

import { getMockMediaFile, MockMediaUploadApiError } from "@/mocks/media/uploads";

type MediaPreviewRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: MediaPreviewRouteContext,
) {
  try {
    const { id } = await context.params;
    const media = getMockMediaFile(decodeURIComponent(id));
    const body = new ArrayBuffer(media.bytes.byteLength);

    new Uint8Array(body).set(media.bytes);

    return new Response(new Blob([body], { type: media.contentType }), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="${media.originalFileName}"`,
        "Content-Length": String(media.sizeBytes),
        "Content-Type": media.contentType,
      },
    });
  } catch (error) {
    if (error instanceof MockMediaUploadApiError) {
      return NextResponse.json(
        { detail: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { detail: "Không thể xem ảnh." },
      { status: 500 },
    );
  }
}
