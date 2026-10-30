import { API_ENDPOINTS } from "@/config/api-endpoints";
import { authApiClient } from "@/services/api-client";
import type { MediaUploadResponse, MediaUploadResult } from "@/types/media";
import { compressImageFile } from "@/utils/image-compression";

export const MAX_MEDIA_FILES_PER_BATCH = 10;

type UploadMediaOptions = {
  fieldName?: string;
  idempotencyKey?: string;
  skipCompression?: boolean;
  maxFiles?: number;
};

const DEFAULT_MEDIA_FILE_FIELD_NAME = "Files";
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
  const maxFiles = options.maxFiles ?? MAX_MEDIA_FILES_PER_BATCH;
  if (files.length > maxFiles) {
    throw new Error(`Chỉ được tải lên tối đa ${maxFiles} tệp trong một lần.`);
  }
  const processedFiles = options.skipCompression
    ? files
    : await Promise.all(files.map((file) => compressImageFile(file)));

  const formData = new FormData();

  for (const file of processedFiles) {
    formData.append(options.fieldName ?? DEFAULT_MEDIA_FILE_FIELD_NAME, file);
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
        imageVariants: result.media.imageVariants ?? [],
      } satisfies MediaUploadResponse;
    });
}

