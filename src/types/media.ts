export type MediaUploadResponse = {
  contentType: string;
  mediaId: string;
  originalFileName: string;
  previewUrl: string;
  previewUrlExpiresAtUtc: string;
  sizeBytes: number;
  status: string;
};
