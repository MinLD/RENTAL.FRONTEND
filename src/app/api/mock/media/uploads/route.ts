import { NextResponse } from "next/server";

import { mockUploadMediaFile, MockMediaUploadApiError } from "@/mocks/media/uploads";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { detail: "Vui lòng chọn file cần tải lên." },
        { status: 400 },
      );
    }

    const response = await mockUploadMediaFile(file);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof MockMediaUploadApiError) {
      return NextResponse.json(
        { detail: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { detail: "Không thể tải ảnh lên." },
      { status: 500 },
    );
  }
}
