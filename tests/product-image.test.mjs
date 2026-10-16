import test from "node:test";
import assert from "node:assert/strict";

// Mock environment variable
process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:8080";

const {
  isMediaServiceUrl,
  getProductImageSrc,
  getMediaOriginalUrl,
  getProductThumbnailSrc,
} = await import("../src/utils/product-image.ts");

const MEDIA_ID = "019488a0-2f3b-71cb-8a02-55d8f630018a";
const RELATIVE_MEDIA_URL = `/api/v1/media/${MEDIA_ID}/content`;
const ABSOLUTE_MEDIA_URL = `http://127.0.0.1:8080/api/v1/media/${MEDIA_ID}/content`;
const PRESIGNED_S3_URL = `http://127.0.0.1:9000/dprental-media/media/${MEDIA_ID}.bin?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc123`;
const EXTERNAL_URL = "https://lh3.googleusercontent.com/a/ACg8ocI=s96-c";
const STATIC_ASSET_URL = "/images/default-avatar.png";

test("isMediaServiceUrl identifies relative and absolute MediaService content URLs", () => {
  assert.equal(isMediaServiceUrl(RELATIVE_MEDIA_URL), true);
  assert.equal(isMediaServiceUrl(ABSOLUTE_MEDIA_URL), true);
  assert.equal(isMediaServiceUrl(PRESIGNED_S3_URL), false);
  assert.equal(isMediaServiceUrl(EXTERNAL_URL), false);
  assert.equal(isMediaServiceUrl(STATIC_ASSET_URL), false);
  assert.equal(isMediaServiceUrl("https://evil.com/api/v1/media/" + MEDIA_ID + "/content"), false);
  assert.equal(isMediaServiceUrl(null), false);
  assert.equal(isMediaServiceUrl(""), false);
});

test("getProductImageSrc applies role-based variants to MediaService URLs", () => {
  assert.equal(
    getProductImageSrc(RELATIVE_MEDIA_URL, "thumbnail"),
    `/api/v1/media/${MEDIA_ID}/content?variant=thumbnail`
  );
  assert.equal(
    getProductImageSrc(RELATIVE_MEDIA_URL, "medium"),
    `/api/v1/media/${MEDIA_ID}/content?variant=medium`
  );
  assert.equal(
    getProductImageSrc(RELATIVE_MEDIA_URL, "large"),
    `/api/v1/media/${MEDIA_ID}/content?variant=large`
  );
  assert.equal(
    getProductImageSrc(RELATIVE_MEDIA_URL, "original"),
    `/api/v1/media/${MEDIA_ID}/content?variant=original`
  );
  assert.equal(
    getProductImageSrc(ABSOLUTE_MEDIA_URL, "thumbnail"),
    `http://127.0.0.1:8080/api/v1/media/${MEDIA_ID}/content?variant=thumbnail`
  );
});

test("getProductImageSrc NEVER appends variant to signed, external, or static URLs", () => {
  assert.equal(getProductImageSrc(PRESIGNED_S3_URL, "thumbnail"), PRESIGNED_S3_URL);
  assert.equal(getProductImageSrc(EXTERNAL_URL, "large"), EXTERNAL_URL);
  assert.equal(getProductImageSrc(STATIC_ASSET_URL, "thumbnail"), STATIC_ASSET_URL);
});

test("getProductImageSrc preserves download=true without adding generated variants", () => {
  const downloadUrl = `/api/v1/media/${MEDIA_ID}/content?download=true`;
  const result = getProductImageSrc(downloadUrl, "thumbnail");
  assert.equal(result, `/api/v1/media/${MEDIA_ID}/content?download=true`);
});

test("getMediaOriginalUrl formats MediaService URL with variant=original", () => {
  assert.equal(
    getMediaOriginalUrl(RELATIVE_MEDIA_URL),
    `/api/v1/media/${MEDIA_ID}/content?variant=original`
  );
  assert.equal(getMediaOriginalUrl(EXTERNAL_URL), EXTERNAL_URL);
});

test("getProductThumbnailSrc picks thumbnail role by default", () => {
  const product = {
    thumbnailUrl: RELATIVE_MEDIA_URL,
    media: [],
  };
  assert.equal(
    getProductThumbnailSrc(product),
    `/api/v1/media/${MEDIA_ID}/content?variant=thumbnail`
  );
});

test("getProductImageSrc strips unsupported query params and retains base path", () => {
  const dirtyUrl = `/api/v1/media/${MEDIA_ID}/content?malicious=attack&foo=bar`;
  const cleanThumb = getProductImageSrc(dirtyUrl, "thumbnail");
  assert.equal(cleanThumb, `/api/v1/media/${MEDIA_ID}/content?variant=thumbnail`);
  assert.doesNotMatch(cleanThumb, /malicious/);
  assert.doesNotMatch(cleanThumb, /foo/);
});

test("All roles map to exact contract variants", () => {
  // Avatar, logo, table row, search, gallery thumbnail -> thumbnail
  assert.equal(getProductImageSrc(RELATIVE_MEDIA_URL, "thumbnail"), `/api/v1/media/${MEDIA_ID}/content?variant=thumbnail`);
  // Card, category, description -> medium
  assert.equal(getProductImageSrc(RELATIVE_MEDIA_URL, "medium"), `/api/v1/media/${MEDIA_ID}/content?variant=medium`);
  // Main gallery -> large
  assert.equal(getProductImageSrc(RELATIVE_MEDIA_URL, "large"), `/api/v1/media/${MEDIA_ID}/content?variant=large`);
  // Dialog zoom -> original
  assert.equal(getProductImageSrc(RELATIVE_MEDIA_URL, "original"), `/api/v1/media/${MEDIA_ID}/content?variant=original`);
});
