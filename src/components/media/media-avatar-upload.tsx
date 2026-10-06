"use client";

import { Camera, LoaderCircle, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { uploadMediaFile, uploadMediaFiles } from "@/services/media-service";
import type { MediaUploadResponse } from "@/types/media";
import { cn } from "@/utils/cn";

type MediaUploadMode = "single" | "multiple";

type MediaAvatarUploadProps = {
  accept?: string;
  className?: string;
  disabled?: boolean;
  emptyLabel?: string;
  fallbackText?: string;
  fieldName?: string;
  mode?: MediaUploadMode;
  onChange?: (
    mediaId: string | string[],
    upload: MediaUploadResponse | MediaUploadResponse[],
  ) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  previewAlt?: string;
  previewUrl?: string | string[] | null;
  replaceLabel?: string;
  size?: "md" | "lg" | "xl";
  uploadLabel?: string;
  uploadFile?: (file: File) => Promise<MediaUploadResponse>;
  uploadFiles?: (files: File[]) => Promise<MediaUploadResponse[]>;
  variant?: "avatar" | "logo";
};

const sizeClassName = {
  lg: "size-24",
  md: "size-20",
  xl: "size-28",
} as const;

const fallbackTextClassName = {
  lg: "text-2xl",
  md: "text-xl",
  xl: "text-3xl",
} as const;

export function MediaAvatarUpload({
  accept = "image/*",
  className,
  disabled = false,
  emptyLabel,
  fallbackText = "DP",
  fieldName,
  mode = "single",
  onChange,
  onUploadingChange,
  previewAlt,
  previewUrl,
  replaceLabel,
  size = "lg",
  uploadLabel,
  uploadFile,
  uploadFiles,
  variant = "avatar",
}: MediaAvatarUploadProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreviewUrls, setLocalPreviewUrls] = useState<string[]>([]);
  const isMultiple = mode === "multiple";
  const logoEmptyLabel = emptyLabel ?? "Tải logo";
  const logoPreviewAlt = previewAlt ?? "Logo doanh nghiệp";
  const logoUploadLabel = uploadLabel ?? "Tải logo doanh nghiệp";
  const logoReplaceLabel = replaceLabel ?? "Thay logo doanh nghiệp";
  const previewUrls = normalizeArray(previewUrl);
  const visiblePreviewUrls =
    previewUrl !== undefined
      ? previewUrls
      : localPreviewUrls.length
        ? localPreviewUrls
        : previewUrls;

  async function handleFileChange(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);

    if (!selectedFiles.length) {
      return;
    }

    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      const uploads = isMultiple
        ? uploadFiles
          ? await uploadFiles(selectedFiles)
          : await uploadMediaFiles(selectedFiles, { fieldName })
        : uploadFile
          ? await uploadFile(selectedFiles[0])
          : await uploadMediaFile(selectedFiles[0], { fieldName });
      const uploadList = Array.isArray(uploads) ? uploads : [uploads];

      setLocalPreviewUrls(uploadList.map((upload) => upload.previewUrl));

      if (Array.isArray(uploads)) {
        onChange?.(
          uploads.map((upload) => upload.mediaId),
          uploads,
        );
      } else {
        onChange?.(uploads.mediaId, uploads);
      }

      toast.success("Tải ảnh thành công.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tải ảnh lên.",
      );
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <input
        accept={accept}
        aria-label={variant === "logo" ? logoUploadLabel : "Chọn ảnh đại diện"}
        className="sr-only"
        disabled={disabled || isUploading}
        id={inputId}
        multiple={isMultiple}
        onChange={(event) => {
          void handleFileChange(event.target.files);
        }}
        ref={fileInputRef}
        type="file"
      />

      {variant === "logo" ? (
        <button
          aria-label={visiblePreviewUrls[0] ? logoReplaceLabel : logoUploadLabel}
          className={cn(
            "relative flex shrink-0 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-primary/40 bg-primary/5 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60",
            sizeClassName[size],
          )}
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {visiblePreviewUrls[0] ? (
            <AvatarWithSkeleton
              alt={logoPreviewAlt}
              className="size-full rounded-none bg-transparent"
              fallback="Logo"
              fallbackClassName="rounded-none bg-primary/5 text-primary"
              imageClassName="object-contain p-2"
              src={visiblePreviewUrls[0]}
            />
          ) : (
            <>
              <Upload className="size-5" />
              <span>{logoEmptyLabel}</span>
            </>
          )}
          {isUploading ? (
            <span className="absolute inset-0 grid place-items-center bg-background/80">
              <LoaderCircle className="size-5 animate-spin" />
            </span>
          ) : null}
        </button>
      ) : isMultiple && visiblePreviewUrls.length ? (
        visiblePreviewUrls.map((url, index) => (
          <AvatarPreview
            fallbackText={`${index + 1}`}
            isUploading={false}
            key={`${url}-${index}`}
            previewUrl={url}
            size={size}
          />
        ))
      ) : (
        <AvatarPreview
          fallbackText={fallbackText}
          isUploading={isUploading}
          previewUrl={visiblePreviewUrls[0]}
          size={size}
        />
      )}

      {variant === "avatar" ? (
        <button
          aria-label="Cập nhật ảnh"
          className={cn(
            "relative z-20 -ml-10 mt-auto inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover",
            "disabled:cursor-not-allowed disabled:opacity-70",
          )}
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {isUploading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Camera size={16} />
          )}
        </button>
      ) : null}
    </div>
  );
}

function AvatarPreview({
  fallbackText,
  isUploading,
  previewUrl,
  size,
}: {
  fallbackText: string;
  isUploading: boolean;
  previewUrl?: string;
  size: "md" | "lg" | "xl";
}) {
  return (
    <div className="relative">
      <AvatarWithSkeleton
        alt={fallbackText}
        className={cn(
          sizeClassName[size],
          "bg-secondary text-secondary-foreground",
        )}
        fallback={fallbackText}
        fallbackClassName={cn(
          "bg-secondary font-bold text-secondary-foreground",
          fallbackTextClassName[size],
        )}
        src={previewUrl}
      />
      {isUploading ? (
        <div className="absolute inset-0 grid place-items-center rounded-full bg-background/70">
          <LoaderCircle className="size-5 animate-spin text-primary" />
        </div>
      ) : null}
    </div>
  );
}

function normalizeArray(value?: string | string[] | null) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}
