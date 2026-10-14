const publicApiUrl = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL)
  : null;

// Allow stable public media endpoints. The optimizer follows their storage
// redirects without exposing temporary storage URLs to the browser.
export const PRODUCT_IMAGE_REMOTE_PATTERNS =
  publicApiUrl && ["https:", "http:"].includes(publicApiUrl.protocol)
    ? [
        {
          protocol:
            publicApiUrl.protocol === "https:"
              ? ("https" as const)
              : ("http" as const),
          hostname: publicApiUrl.hostname,
          port: publicApiUrl.port,
          pathname: `${publicApiUrl.pathname.replace(/\/+$/, "")}/api/v1/media/*/content`,
          search: "",
        },
      ]
    : [];

export const PRODUCT_IMAGE_LOAD_TIMEOUT_MS = 30_000;

export const PRODUCT_CARD_IMAGE_SIZES =
  "(min-width: 1280px) 310px, (min-width: 1024px) calc(50vw - 168px), (min-width: 768px) calc(50vw - 32px), (min-width: 640px) calc(50vw - 24px), calc(100vw - 32px)";

export const PRODUCT_GALLERY_IMAGE_SIZES =
  "(min-width: 1280px) 848px, (min-width: 1024px) calc(100vw - 416px), (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)";

export const PRODUCT_DESCRIPTION_IMAGE_SIZES =
  "(min-width: 1280px) 309px, (min-width: 1024px) calc(37.5vw - 165px), (min-width: 768px) calc(37.5vw - 27px), (min-width: 640px) calc(37.5vw - 21px), calc(100vw - 32px)";

export const PRODUCT_ZOOM_IMAGE_SIZES =
  "(min-width: 1056px) 974px, calc(100vw - 82px)";
