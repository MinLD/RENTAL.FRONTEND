import type { PublicEquipmentListing } from "@/types/inventory";

function getConfiguredApiOrigin(): URL | null {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) return null;
  try {
    const url = new URL(envUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

export type ProductImageRole = "thumbnail" | "medium" | "large" | "original";

export const ALLOWED_VARIANTS = ["thumbnail", "medium", "large", "original"] as const;
export type AllowedVariant = (typeof ALLOWED_VARIANTS)[number];

const SIGNED_QUERY_PARAMS = [
  "x-amz-signature",
  "x-amz-credential",
  "x-amz-algorithm",
  "x-amz-date",
  "x-amz-security-token",
  "signature",
  "expires",
  "awsaccesskeyid",
];

const MEDIA_CONTENT_REGEX = /\/api\/v1\/media\/[0-9a-fA-F-]{36}\/content$/;

/**
 * Kiểm tra xem một chuỗi URL có phải là URL content của MediaService trên origin hợp lệ hay không.
 */
export function isMediaServiceUrl(src?: string | null): boolean {
  if (!src) return false;
  const value = src.trim();
  if (!value || value.includes("\\")) return false;

  try {
    const isRelative = value.startsWith("/") && !value.startsWith("//");
    const parsed = isRelative
      ? new URL(value, "https://local.invalid")
      : new URL(value);

    // Không chấp nhận URL có nhúng credentials
    if (parsed.username || parsed.password) return false;

    // Kiểm tra định dạng path: kết thúc bằng /api/v1/media/{uuid}/content
    if (!MEDIA_CONTENT_REGEX.test(parsed.pathname)) return false;

    // Nếu chứa các tham số ký của S3/MinIO thì là presigned URL, không thêm query
    const hasSignedParams = Array.from(parsed.searchParams.keys()).some((k) =>
      SIGNED_QUERY_PARAMS.includes(k.toLowerCase()),
    );
    if (hasSignedParams) return false;

    // Nếu là URL tuyệt đối, kiểm tra origin có thuộc allowlist/configured API URL không
    if (!isRelative) {
      const configured = getConfiguredApiOrigin();
      if (!configured) return false;
      if (
        parsed.protocol !== configured.protocol ||
        parsed.hostname !== configured.hostname ||
        parsed.port !== configured.port
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Chuẩn hóa URL ảnh và gắn query variant tương ứng nếu là MediaService URL.
 * Tuyệt đối không thêm query vào: URL ký, ảnh bên ngoài, static asset hoặc URL download.
 */
export function getProductImageSrc(
  src?: string | null,
  role?: ProductImageRole,
): string | null {
  if (!src) return null;
  const value = src.trim();
  if (!value || value.includes("\\")) return null;

  try {
    const isRelative = value.startsWith("/") && !value.startsWith("//");
    let parsed = isRelative
      ? new URL(value, "https://local.invalid")
      : new URL(value);

    if (parsed.username || parsed.password) return null;

    // Không thêm query vào URL ký, static assets hoặc ảnh bên ngoài không thuộc MediaService
    if (!isMediaServiceUrl(value)) {
      if (isRelative) {
        parsed.hash = "";
        return `${parsed.pathname}${parsed.search}`;
      }
      if (["http:", "https:"].includes(parsed.protocol)) {
        parsed.hash = "";
        return parsed.href;
      }
      return null;
    }

    // Relative media references belong to the API, not the frontend host.
    if (isRelative) {
      const configured = getConfiguredApiOrigin();
      if (!configured) return null;
      const basePath = configured.pathname.replace(/\/+$/, "");
      const contentPath = basePath && parsed.pathname.startsWith(`${basePath}/`)
        ? parsed.pathname
        : `${basePath}${parsed.pathname}`;
      parsed = new URL(`${contentPath}${parsed.search}`, configured.origin);
    }

    parsed.hash = "";

    // Nếu URL download=true, giữ nguyên download=true và không gắn variant được tạo
    if (parsed.searchParams.get("download") === "true") {
      const filteredParams = new URLSearchParams();
      filteredParams.set("download", "true");
      parsed.search = filteredParams.toString() ? `?${filteredParams.toString()}` : "";
      return parsed.href;
    }

    // Chỉ chấp nhận các query được hỗ trợ: variant và download
    const existingDownload = parsed.searchParams.get("download");
    const existingVariant = parsed.searchParams.get("variant")?.toLowerCase();

    const targetVariant = role ?? (existingVariant as ProductImageRole | undefined);

    const newParams = new URLSearchParams();
    if (existingDownload) {
      newParams.set("download", existingDownload);
    }

    if (targetVariant && ALLOWED_VARIANTS.includes(targetVariant as AllowedVariant)) {
      newParams.set("variant", targetVariant);
    }

    parsed.search = newParams.toString() ? `?${newParams.toString()}` : "";
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Lấy URL ảnh gốc cho MediaService URL (dùng để fallback khi variant lỗi).
 */
export function getMediaOriginalUrl(src?: string | null): string | null {
  return getProductImageSrc(src, "original");
}

// Remote sources (including signed storage URLs) are delivered directly to the
// browser. Local static assets can still use Next.js image optimization.
export function shouldBypassProductImageOptimization(src: string): boolean {
  return isMediaServiceUrl(src) || /^https?:\/\//i.test(src);
}

export function getProductThumbnailSrc(
  product: Pick<PublicEquipmentListing, "thumbnailUrl" | "media">,
  role: ProductImageRole = "thumbnail",
) {
  return (
    getProductImageSrc(product.thumbnailUrl, role) ||
    product.media?.map((media) => getProductImageSrc(media.url, role)).find(Boolean) ||
    null
  );
}
