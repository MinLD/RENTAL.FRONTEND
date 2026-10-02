export type MediaUploadResponse = {
  contentType: string;
  mediaId: string;
  originalFileName: string;
  previewUrl: string;
  previewUrlExpiresAtUtc: string;
  sizeBytes: number;
  status: string;
};

// Saved documents have an ID and optional preview, without upload-only metadata.
export type MediaDocumentReference = Pick<MediaUploadResponse, "mediaId" | "originalFileName" | "previewUrl"> &
  Partial<Omit<MediaUploadResponse, "mediaId" | "originalFileName" | "previewUrl">>;

export type MediaCompletedDto = {
  contentType: string | null;
  mediaId: string;
  originalFileName: string | null;
  previewUrl: string | null;
  previewUrlExpiresAtUtc: string | null;
  sizeBytes: number;
  status: string | null;
};

export type MediaUploadError = {
  code: string | null;
  message: string | null;
};

export type MediaUploadResult = {
  error: MediaUploadError | null;
  fileName: string | null;
  index: number;
  media: MediaCompletedDto | null;
};
