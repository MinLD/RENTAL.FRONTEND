"use client";

import { FileText, LoaderCircle, Upload, X } from "lucide-react";
import { forwardRef, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { uploadMediaFile } from "@/services/media-service";
import type { MediaUploadResponse } from "@/types/media";
import { cn } from "@/utils/cn";

const DEFAULT_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type MediaDocumentUploadProps = {
  allowedContentTypes?: readonly string[];
  disabled?: boolean;
  error?: string;
  label?: string;
  maxSizeBytes?: number;
  onChange: (upload: MediaUploadResponse | null) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  uploadFile?: (file: File) => Promise<MediaUploadResponse>;
  value?: MediaUploadResponse | null;
};

export const MediaDocumentUpload = forwardRef<
  HTMLButtonElement,
  MediaDocumentUploadProps
>(
  (
    {
      allowedContentTypes = DEFAULT_CONTENT_TYPES,
      disabled = false,
      error,
      label = "Tải tài liệu",
      maxSizeBytes = 10 * 1024 * 1024,
      onChange,
      onUploadingChange,
      uploadFile = uploadMediaFile,
      value,
    },
    ref,
  ) => {
    const inputId = useId();
    const errorId = `${inputId}-error`;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadInProgressRef = useRef(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const visibleError = uploadError || error;
    const isDisabled = disabled || isUploading;
    const formats = allowedContentTypes
      .map((type) =>
        type === "image/jpeg" ? "JPG" : type.split("/")[1].toUpperCase(),
      )
      .join(", ");

    async function handleFiles(files: File[]) {
      if (disabled || uploadInProgressRef.current || !files.length) {
        return;
      }

      setUploadError("");

      if (files.length !== 1) {
        setUploadError("Vui lòng chọn một tài liệu mỗi lần.");
        return;
      }

      const file = files[0];

      if (!allowedContentTypes.includes(file.type)) {
        setUploadError(`Tài liệu chỉ hỗ trợ ${formats}.`);
        return;
      }

      if (!file.size) {
        setUploadError("Tài liệu không được là tệp rỗng.");
        return;
      }

      if (file.size > maxSizeBytes) {
        setUploadError(`Tài liệu không được quá ${formatFileSize(maxSizeBytes)}.`);
        return;
      }

      uploadInProgressRef.current = true;
      setIsUploading(true);
      onUploadingChange?.(true);

      try {
        const upload = await uploadFile(file);

        onChange({
          ...upload,
          originalFileName: upload.originalFileName || file.name,
        });
        toast.success("Tải tài liệu thành công.");
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Không thể tải tài liệu lên.",
        );
      } finally {
        uploadInProgressRef.current = false;
        setIsUploading(false);
        onUploadingChange?.(false);
      }
    }

    return (
      <div className="space-y-2">
        <input
          accept={allowedContentTypes.join(",")}
          aria-label={`Chọn tệp: ${label}`}
          className="sr-only"
          disabled={isDisabled}
          id={inputId}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void handleFiles(files);
          }}
          ref={fileInputRef}
          tabIndex={-1}
          type="file"
        />
        <div
          className={cn(
            "rounded-xl border border-dashed bg-blue-50/40 transition-colors",
            isDragging ? "border-blue-500 bg-blue-50" : "border-blue-300",
            visibleError && "border-error",
          )}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsDragging(false);
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!isDisabled) {
              setIsDragging(true);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void handleFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <button
            aria-describedby={visibleError ? errorId : undefined}
            aria-label={value ? `Thay tài liệu: ${label}` : label}
            className="flex min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl px-4 py-6 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDisabled}
            onClick={() => fileInputRef.current?.click()}
            ref={ref}
            type="button"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              {isUploading ? (
                <LoaderCircle className="size-6 animate-spin" />
              ) : value ? (
                <FileText className="size-6" />
              ) : (
                <Upload className="size-6" />
              )}
            </span>
            <span className="max-w-full break-all text-sm font-semibold text-foreground">
              {isUploading
                ? "Đang tải tài liệu..."
                : value
                  ? value.originalFileName
                  : label}
            </span>
            <span className="text-xs text-muted-foreground">
              {value
                ? "Chọn để thay tài liệu"
                : "Kéo thả tệp vào đây hoặc chọn từ thiết bị"}
            </span>
            <span className="text-xs text-muted-foreground">
              Hỗ trợ {formats}. Tối đa {formatFileSize(maxSizeBytes)}.
            </span>
          </button>
          {value ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 px-4 py-2">
              <span className="text-xs text-muted-foreground">
                Đã tải lên · {formatFileSize(value.sizeBytes)}
              </span>
              <div className="flex items-center gap-2">
                {value.previewUrl ? (
                  <Button asChild size="sm" variant="ghost">
                    <a
                      href={value.previewUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Xem tài liệu
                    </a>
                  </Button>
                ) : null}
                <Button
                  disabled={isDisabled}
                  onClick={() => {
                    setUploadError("");
                    onChange(null);
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <X className="size-4" /> Xóa tài liệu
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        {visibleError ? (
          <p className="text-xs font-medium text-error" id={errorId} role="alert">
            {visibleError}
          </p>
        ) : null}
      </div>
    );
  },
);

MediaDocumentUpload.displayName = "MediaDocumentUpload";

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`;
  }

  return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}
