import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import type { MediaUploadResponse } from "@/types/media";

type UploadMediaOptions = {
  fieldName?: string;
  idempotencyKey?: string;
};

export async function uploadMediaFile(
  file: File,
  options: UploadMediaOptions = {},
) {
  const formData = new FormData();

  formData.set(options.fieldName ?? "file", file);

  return authApiClientJson<MediaUploadResponse>(
    API_ENDPOINTS.backend.media.upload,
    {
      body: formData,
      headers: {
        "idempotency-key": options.idempotencyKey ?? crypto.randomUUID(),
      },
      method: "POST",
    },
  );
}

export async function uploadMediaFiles(
  files: File[],
  options: UploadMediaOptions = {},
) {
  return Promise.all(files.map((file) => uploadMediaFile(file, options)));
}
