import test from "node:test";
import assert from "node:assert/strict";

const { isSafeRelativeUrl, getSafeRelativeUrl } = await import(
  "../src/utils/safe-url.ts"
);

test("isSafeRelativeUrl validates safe relative internal URLs", () => {
  assert.equal(isSafeRelativeUrl("/"), true);
  assert.equal(isSafeRelativeUrl("/notifications"), true);
  assert.equal(isSafeRelativeUrl("/own/notifications"), true);
  assert.equal(isSafeRelativeUrl("/admin/notifications"), true);
  assert.equal(isSafeRelativeUrl("/orders/123?tab=active#details"), true);
  assert.equal(isSafeRelativeUrl("/checkout/summary"), true);
  assert.equal(isSafeRelativeUrl("  /notifications  "), true);
});

test("isSafeRelativeUrl rejects protocol-relative URLs", () => {
  assert.equal(isSafeRelativeUrl("//evil.com"), false);
  assert.equal(isSafeRelativeUrl("//evil.com/phishing"), false);
  assert.equal(isSafeRelativeUrl("///evil.com"), false);
});

test("isSafeRelativeUrl rejects Windows-style backslashes", () => {
  assert.equal(isSafeRelativeUrl("/\\evil.com"), false);
  assert.equal(isSafeRelativeUrl("\\evil.com"), false);
  assert.equal(isSafeRelativeUrl("\\\\evil.com"), false);
});

test("isSafeRelativeUrl rejects javascript:, data:, and vbscript: schemes", () => {
  assert.equal(isSafeRelativeUrl("javascript:alert(1)"), false);
  assert.equal(isSafeRelativeUrl("JAVASCRIPT:alert(1)"), false);
  assert.equal(isSafeRelativeUrl("javascript : alert(1)"), false);
  assert.equal(isSafeRelativeUrl("java\tscript:alert(1)"), false);
  assert.equal(isSafeRelativeUrl("data:text/html,<script>"), false);
  assert.equal(isSafeRelativeUrl("vbscript:msgbox(1)"), false);
});

test("isSafeRelativeUrl rejects absolute URLs and colons in path", () => {
  assert.equal(isSafeRelativeUrl("https://example.com/notifications"), false);
  assert.equal(isSafeRelativeUrl("http://localhost:3000"), false);
  assert.equal(isSafeRelativeUrl("/api:v1/test"), false);
  assert.equal(isSafeRelativeUrl("/path:name"), false);
});

test("isSafeRelativeUrl rejects control characters and non-strings", () => {
  assert.equal(isSafeRelativeUrl("/\0evil"), false);
  assert.equal(isSafeRelativeUrl("/\x1bevil"), false);
  assert.equal(isSafeRelativeUrl(""), false);
  assert.equal(isSafeRelativeUrl("   "), false);
  assert.equal(isSafeRelativeUrl(null), false);
  assert.equal(isSafeRelativeUrl(undefined), false);
  assert.equal(isSafeRelativeUrl(123), false);
  assert.equal(isSafeRelativeUrl({}), false);
});

test("getSafeRelativeUrl returns valid URL or fallback", () => {
  assert.equal(getSafeRelativeUrl("/orders/123"), "/orders/123");
  assert.equal(getSafeRelativeUrl("https://evil.com"), "/notifications");
  assert.equal(getSafeRelativeUrl(null, "/fallback"), "/fallback");
});
