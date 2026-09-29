import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClientJson } from "@/services/api-client";
import type { MediaUploadResponse } from "@/types/media";

type UploadMediaOptions = {
  fieldName?: string;
  idempotencyKey?: string;
};

const DEFAULT_MEDIA_FILE_FIELD_NAME = "File";
const MEDIA_CHECKSUM_FIELD_NAME = "Sha256Checksum";
const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

export async function uploadMediaFile(
  file: File,
  options: UploadMediaOptions = {},
) {
  const formData = new FormData();

  formData.set(options.fieldName ?? DEFAULT_MEDIA_FILE_FIELD_NAME, file);
  formData.set(MEDIA_CHECKSUM_FIELD_NAME, await getFileSha256Checksum(file));

  return authApiClientJson<MediaUploadResponse>(
    API_ENDPOINTS.backend.media.upload,
    {
      body: formData,
      headers: {
        [IDEMPOTENCY_KEY_HEADER]: options.idempotencyKey ?? crypto.randomUUID(),
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

async function getFileSha256Checksum(file: File) {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
