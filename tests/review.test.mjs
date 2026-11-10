import assert from "node:assert/strict";
import test from "node:test";
import {
  formatReviewEtag,
  getReviewId,
  incrementReviewEtag,
  normalizeReviewItem,
} from "../src/utils/review.ts";

test("formatReviewEtag normalizes raw integers, quoted integers, and weak ETags into quoted positive integer", () => {
  assert.equal(formatReviewEtag('"1"'), '"1"');
  assert.equal(formatReviewEtag("1"), '"1"');
  assert.equal(formatReviewEtag('W/"2"'), '"2"');
  assert.equal(formatReviewEtag('w/"15"'), '"15"');
  assert.equal(formatReviewEtag(null, 3), '"3"');
  assert.equal(formatReviewEtag(undefined, undefined), '"1"');
  assert.equal(formatReviewEtag("", 0), '"1"');
});

test("incrementReviewEtag increments the version integer inside double quotes", () => {
  assert.equal(incrementReviewEtag('"1"'), '"2"');
  assert.equal(incrementReviewEtag('W/"3"'), '"4"');
  assert.equal(incrementReviewEtag(null), '"2"');
});

test("normalizeReviewItem maps reviewId to id and formats etag from version", () => {
  const raw = {
    reviewId: "rev-123",
    targetType: "listing",
    targetId: "list-456",
    rating: 5,
    authorMaskedName: "Ng***n",
    version: 2,
  };
  const normalized = normalizeReviewItem(raw);
  assert.equal(normalized.id, "rev-123");
  assert.equal(getReviewId(normalized), "rev-123");
  assert.equal(normalized.authorName, "Ng***n");
  assert.equal(normalized.etag, '"2"');
});
