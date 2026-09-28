"use client";

import { Camera, LoaderCircle } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadMediaFile, uploadMediaFiles } from "@/services/media-service";
import type { MediaUploadResponse } from "@/types/media";
import { cn } from "@/utils/cn";

type MediaUploadMode = "single" | "multiple";

type MediaAvatarUploadProps = {
  accept?: string;
  className?: string;
  disabled?: boolean;
  fallbackText?: string;
  fieldName?: string;
  mode?: MediaUploadMode;
  onChange?: (
    mediaId: string | string[],
    upload: MediaUploadResponse | MediaUploadResponse[],
  ) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  previewUrl?: string | string[] | null;
  size?: "md" | "lg" | "xl";
  uploadFile?: (file: File) => Promise<MediaUploadResponse>;
  uploadFiles?: (files: File[]) => Promise<MediaUploadResponse[]>;
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
  fallbackText = "DP",
  fieldName,
  mode = "single",
  onChange,
  onUploadingChange,
  previewUrl,
  size = "lg",
  uploadFile,
  uploadFiles,
}: MediaAvatarUploadProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreviewUrls, setLocalPreviewUrls] = useState<string[]>([]);
  const isMultiple = mode === "multiple";
  const previewUrls = normalizeArray(previewUrl);
  const visiblePreviewUrls = localPreviewUrls.length
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

      {isMultiple && visiblePreviewUrls.length ? (
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

      <button
        aria-label="Cập nhật ảnh"
        className={cn(
          "relative -ml-10 mt-auto inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover",
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
      <Avatar
        className={cn(
          sizeClassName[size],
          "bg-secondary text-secondary-foreground",
        )}
      >
        {previewUrl ? <AvatarImage alt={fallbackText} src={previewUrl} /> : null}
        <AvatarFallback
          className={cn(
            "bg-secondary font-bold text-secondary-foreground",
            fallbackTextClassName[size],
          )}
        >
          {fallbackText}
        </AvatarFallback>
      </Avatar>
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
