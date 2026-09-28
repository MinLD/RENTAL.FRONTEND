import type { MediaUploadResponse } from "@/types/media";

type MockMediaFile = {
  bytes: Uint8Array;
  contentType: string;
  mediaId: string;
  originalFileName: string;
  sizeBytes: number;
};

export class MockMediaUploadApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MockMediaUploadApiError";
    this.status = status;
  }
}

const globalMediaStore = globalThis as typeof globalThis & {
  __dprentalMockMediaUploads?: Map<string, MockMediaFile>;
};

function getMediaStore() {
  if (!globalMediaStore.__dprentalMockMediaUploads) {
    globalMediaStore.__dprentalMockMediaUploads = new Map();
  }

  return globalMediaStore.__dprentalMockMediaUploads;
}

export async function mockUploadMediaFile(file: File) {
  await simulateNetworkDelay();

  if (!file.size) {
    throw new MockMediaUploadApiError("File tải lên không hợp lệ.");
  }

  const mediaId = `mock-media-${Date.now().toString(36)}-${crypto.randomUUID()}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";
  const originalFileName = file.name || "upload";
  const store = getMediaStore();

  store.set(mediaId, {
    bytes,
    contentType,
    mediaId,
    originalFileName,
    sizeBytes: file.size,
  });

  return {
    contentType,
    mediaId,
    originalFileName,
    previewUrl: `/api/mock/media/uploads/${encodeURIComponent(mediaId)}/preview`,
    previewUrlExpiresAtUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    sizeBytes: file.size,
    status: "Uploaded",
  } satisfies MediaUploadResponse;
}

export function getMockMediaFile(mediaId: string) {
  const media = getMediaStore().get(mediaId);

  if (!media) {
    throw new MockMediaUploadApiError("Không tìm thấy file media.", 404);
  }

  return media;
}

function simulateNetworkDelay() {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, 500);
  });
}
