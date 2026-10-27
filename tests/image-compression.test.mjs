import test from "node:test";
import assert from "node:assert/strict";

const {
  isCompressibleImage,
  compressImageFile,
} = await import("../src/utils/image-compression.ts");

test("isCompressibleImage correctly identifies JPEG, PNG, and WebP", () => {
  assert.equal(isCompressibleImage("image/jpeg"), true);
  assert.equal(isCompressibleImage("image/JPEG"), true);
  assert.equal(isCompressibleImage("image/jpg"), true);
  assert.equal(isCompressibleImage("image/png"), true);
  assert.equal(isCompressibleImage("image/webp"), true);

  assert.equal(isCompressibleImage("image/gif"), false);
  assert.equal(isCompressibleImage("image/svg+xml"), false);
  assert.equal(isCompressibleImage("application/pdf"), false);
  assert.equal(isCompressibleImage("text/plain"), false);
  assert.equal(isCompressibleImage(""), false);
});

test("compressImageFile returns original file untouched in non-browser/SSR environment", async () => {
  const fakeFile = new File(["test data"], "test.png", { type: "image/png" });
  const result = await compressImageFile(fakeFile);
  assert.equal(result, fakeFile);
});

test("compressImageFile returns non-image files untouched", async () => {
  const pdfFile = new File(["%PDF-1.4"], "document.pdf", { type: "application/pdf" });
  const result = await compressImageFile(pdfFile);
  assert.equal(result, pdfFile);
});

test("compressImageFile with mocked canvas performs resize and returns compressed File", async () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalCreateImageBitmap = globalThis.createImageBitmap;

  try {
    globalThis.window = {};
    let capturedWidth = 0;
    let capturedHeight = 0;
    let capturedMimeType = "";
    let capturedQuality = 0;

    globalThis.createImageBitmap = async () => ({
      width: 4000,
      height: 3000,
      close: () => {},
    });

    globalThis.document = {
      createElement: (tag) => {
        if (tag === "canvas") {
          return {
            width: 0,
            height: 0,
            getContext: () => ({
              drawImage: (_source, _x, _y, w, h) => {
                capturedWidth = w;
                capturedHeight = h;
              },
            }),
            toBlob: (callback, mimeType, quality) => {
              capturedMimeType = mimeType;
              capturedQuality = quality;
              callback(new Blob(["compressed data".repeat(10)], { type: mimeType }));
            },
          };
        }
        return {};
      },
    };

    const largeData = new Uint8Array(2 * 1024 * 1024);
    const largeFile = new File([largeData], "photo.png", { type: "image/png" });

    const compressed = await compressImageFile(largeFile, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.82,
    });

    assert.equal(capturedWidth, 1920);
    assert.equal(capturedHeight, 1440);
    assert.equal(capturedMimeType, "image/webp");
    assert.equal(capturedQuality, 0.82);
    assert.notEqual(compressed, largeFile);
    assert.equal(compressed.name, "photo.webp");
    assert.equal(compressed.type, "image/webp");
    assert.ok(compressed.size < largeFile.size);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.createImageBitmap = originalCreateImageBitmap;
  }
});

test("compressImageFile retains original file if compressed output is larger", async () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalCreateImageBitmap = globalThis.createImageBitmap;

  try {
    globalThis.window = {};
    globalThis.createImageBitmap = async () => ({
      width: 2000,
      height: 2000,
      close: () => {},
    });

    globalThis.document = {
      createElement: (tag) => {
        if (tag === "canvas") {
          return {
            width: 0,
            height: 0,
            getContext: () => ({
              drawImage: () => {},
            }),
            toBlob: (callback, mimeType) => {
              callback(new Blob([new Uint8Array(10 * 1024 * 1024)], { type: mimeType }));
            },
          };
        }
        return {};
      },
    };

    const smallData = new Uint8Array(500 * 1024);
    const smallFile = new File([smallData], "small.jpg", { type: "image/jpeg" });

    const result = await compressImageFile(smallFile);
    assert.equal(result, smallFile);
  } finally {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.createImageBitmap = originalCreateImageBitmap;
  }
});
