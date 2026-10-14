import { PRODUCT_IMAGE_REMOTE_PATTERNS } from "@/config/product-images";
import type { PublicEquipmentListing } from "@/types/inventory";

export function getProductImageSrc(src?: string | null) {
  const value = src?.trim();
  if (!value || value.includes("\\")) return null;
  try {
    if (value.startsWith("/") && !value.startsWith("//")) {
      const url = new URL(value, "https://local.invalid");
      return `${url.pathname}${url.search}`;
    }
    const url = new URL(value);
    if (url.username || url.password) return null;
    const allowed = PRODUCT_IMAGE_REMOTE_PATTERNS.some((pattern) => {
      const prefix = pattern.pathname.split("*")[0];
      const mediaPath = url.pathname.slice(prefix.length);
      return (
        url.protocol === `${pattern.protocol}:` &&
        url.hostname === pattern.hostname &&
        url.port === pattern.port &&
        url.search === pattern.search &&
        url.pathname.startsWith(prefix) &&
        /^[^/]+\/content$/.test(mediaPath)
      );
    });
    url.hash = "";
    return allowed ? url.href : null;
  } catch {
    return null;
  }
}

export function getProductThumbnailSrc(
  product: Pick<PublicEquipmentListing, "thumbnailUrl" | "media">,
) {
  return (
    getProductImageSrc(product.thumbnailUrl) ||
    product.media?.map((media) => getProductImageSrc(media.url)).find(Boolean) ||
    null
  );
}
