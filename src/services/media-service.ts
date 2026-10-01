import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClient } from "@/services/api-client";
import type { MediaUploadResponse, MediaUploadResult } from "@/types/media";

type UploadMediaOptions = {
  fieldName?: string;
  idempotencyKey?: string;
};

const DEFAULT_MEDIA_FILE_FIELD_NAME = "Files";
const MEDIA_CHECKSUM_FIELD_NAME = "Sha256Checksums";
const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

export async function uploadMediaFile(
  file: File,
  options: UploadMediaOptions = {},
) {
  const [upload] = await uploadMediaFiles([file], options);

  if (!upload) {
    throw new Error("Không nhận được phản hồi upload tệp.");
  }

  return upload;
}

export async function uploadMediaFiles(
  files: File[],
  options: UploadMediaOptions = {},
) {
  if (!files.length) {
    return [];
  }

  const formData = new FormData();

  for (const file of files) {
    formData.append(options.fieldName ?? DEFAULT_MEDIA_FILE_FIELD_NAME, file);
    formData.append(MEDIA_CHECKSUM_FIELD_NAME, await getFileSha256Checksum(file));
  }

  const response = await authApiClient(API_ENDPOINTS.backend.media.upload, {
    body: formData,
    headers: {
      [IDEMPOTENCY_KEY_HEADER]: options.idempotencyKey ?? crypto.randomUUID(),
    },
    method: "POST",
  });
  const results = (await response.json()) as MediaUploadResult[];

  return normalizeUploadResults(results);
}

function normalizeUploadResults(results: MediaUploadResult[]) {
  return [...results]
    .sort((current, next) => current.index - next.index)
    .map((result) => {
      if (result.error) {
        throw new Error(
          result.error.message ??
            result.error.code ??
            `Không thể tải tệp ${result.fileName ?? ""} lên.`.trim(),
        );
      }

      if (!result.media) {
        throw new Error(
          `Không nhận được media cho tệp ${result.fileName ?? ""}.`.trim(),
        );
      }

      return {
        contentType: result.media.contentType ?? "",
        mediaId: result.media.mediaId,
        originalFileName: result.media.originalFileName ?? result.fileName ?? "",
        previewUrl: result.media.previewUrl ?? "",
        previewUrlExpiresAtUtc: result.media.previewUrlExpiresAtUtc ?? "",
        sizeBytes: result.media.sizeBytes,
        status: result.media.status ?? "",
      } satisfies MediaUploadResponse;
    });
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
