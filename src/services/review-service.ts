import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  apiClientJson,
  authApiClient,
  authApiClientJson,
} from "@/services/api-client";
import type {
  CreateReviewRequest,
  PendingReviewsPage,
  RenterReputationResponse,
  ReviewItem,
  ReviewListPage,
  ReviewMediaAccessResponse,
  ReviewSummaryResponse,
  UpdateReviewRequest,
} from "@/types/review";
import {
  formatReviewEtag,
  incrementReviewEtag,
  normalizeReviewItem,
  normalizeReviewListPage,
} from "@/utils/review";

export const DEFAULT_REVIEW_PAGE_SIZE = 10;

const summaryCache = new Map<string, Promise<ReviewSummaryResponse>>();

export function invalidateReviewSummaryCache(
  targetType?: string,
  targetId?: string,
) {
  if (targetType && targetId) {
    summaryCache.delete(`${targetType}:${targetId}`);
  } else {
    summaryCache.clear();
  }
}

export async function getReviewSummary(
  targetType: "listing" | "supplier" | string,
  targetId: string,
): Promise<ReviewSummaryResponse> {
  const cacheKey = `${targetType}:${targetId}`;
  const existing = summaryCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    try {
      const data = await apiClientJson<ReviewSummaryResponse>(
        API_ENDPOINTS.backend.reviews.summary(targetType, targetId),
        { cache: "no-store" },
      );
      if (!data) {
        return createEmptyReviewSummary(targetType, targetId);
      }
      return data;
    } catch {
      // If no summary exists yet or API returns 404, return empty summary safely
      return createEmptyReviewSummary(targetType, targetId);
    }
  })();

  summaryCache.set(cacheKey, promise);
  return promise;
}

export function createEmptyReviewSummary(
  targetType: string,
  targetId: string,
): ReviewSummaryResponse {
  return {
    targetType,
    targetId,
    averageRating: null,
    reviewCount: 0,
    ratingDistribution: {
      "5": 0,
      "4": 0,
      "3": 0,
      "2": 0,
      "1": 0,
    },
  };
}

export async function getListingReviews(
  listingId: string,
  page = 1,
  pageSize = DEFAULT_REVIEW_PAGE_SIZE,
): Promise<ReviewListPage> {
  try {
    const data = await apiClientJson<ReviewListPage>(
      API_ENDPOINTS.backend.reviews.byListing(listingId, { page, pageSize }),
      { cache: "no-store" },
    );
    return normalizeReviewListPage(data, page, pageSize);
  } catch {
    return {
      items: [],
      page,
      pageSize,
      totalCount: 0,
      totalPages: 0,
    };
  }
}

export async function getSupplierReviews(
  supplierId: string,
  page = 1,
  pageSize = DEFAULT_REVIEW_PAGE_SIZE,
): Promise<ReviewListPage> {
  try {
    const data = await apiClientJson<ReviewListPage>(
      API_ENDPOINTS.backend.reviews.bySupplier(supplierId, { page, pageSize }),
      { cache: "no-store" },
    );
    return normalizeReviewListPage(data, page, pageSize);
  } catch {
    return {
      items: [],
      page,
      pageSize,
      totalCount: 0,
      totalPages: 0,
    };
  }
}

export async function getPendingReviews(
  page = 1,
  pageSize = 50,
): Promise<PendingReviewsPage> {
  try {
    const data = await authApiClientJson<PendingReviewsPage>(
      API_ENDPOINTS.backend.reviews.pending({ page, pageSize }),
      { cache: "no-store" },
    );
    return (
      data ?? {
        items: [],
        page,
        pageSize,
        totalCount: 0,
        totalPages: 0,
      }
    );
  } catch {
    return {
      items: [],
      page,
      pageSize,
      totalCount: 0,
      totalPages: 0,
    };
  }
}

export async function getMyReviews(
  page = 1,
  pageSize = DEFAULT_REVIEW_PAGE_SIZE,
): Promise<ReviewListPage> {
  try {
    const data = await authApiClientJson<ReviewListPage>(
      API_ENDPOINTS.backend.reviews.my({ page, pageSize }),
      { cache: "no-store" },
    );
    return normalizeReviewListPage(data, page, pageSize);
  } catch {
    return {
      items: [],
      page,
      pageSize,
      totalCount: 0,
      totalPages: 0,
    };
  }
}

export async function getMyReputation(): Promise<RenterReputationResponse | null> {
  try {
    const data = await authApiClientJson<RenterReputationResponse>(
      API_ENDPOINTS.backend.reviews.myReputation,
      { cache: "no-store" },
    );
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getReviewDetail(
  reviewId: string,
): Promise<{ review: ReviewItem; etag: string }> {
  const response = await authApiClient(
    API_ENDPOINTS.backend.reviews.detail(reviewId),
    { cache: "no-store" },
  );
  const rawHeaderEtag =
    response.headers.get("ETag") || response.headers.get("etag");
  const data = (await response.json()) as ReviewItem;
  const normalized = normalizeReviewItem(data);
  const formattedEtag = formatReviewEtag(
    rawHeaderEtag ?? normalized.etag,
    normalized.version,
  );
  normalized.etag = formattedEtag;
  return { review: normalized, etag: formattedEtag };
}

export async function updateReview(
  reviewId: string,
  payload: UpdateReviewRequest,
  etag?: string | null,
  idempotencyKey?: string,
): Promise<{ etag: string }> {
  const previousEtag = formatReviewEtag(etag);
  const headers: Record<string, string> = {
    "Idempotency-Key": idempotencyKey || crypto.randomUUID(),
    "If-Match": previousEtag,
  };

  const response = await authApiClient(
    API_ENDPOINTS.backend.reviews.update(reviewId),
    {
      method: "PUT",
      headers,
      json: payload,
    },
  );

  invalidateReviewSummaryCache();
  const nextRawEtag =
    response.headers.get("ETag") || response.headers.get("etag");
  return {
    etag: nextRawEtag
      ? formatReviewEtag(nextRawEtag)
      : incrementReviewEtag(previousEtag),
  };
}

export async function withdrawReview(
  reviewId: string,
  reason?: string | null,
  etag?: string | null,
  idempotencyKey?: string,
): Promise<void> {
  let resolvedEtag = etag;
  if (!resolvedEtag) {
    try {
      const detail = await getReviewDetail(reviewId);
      resolvedEtag = detail.etag;
    } catch {
      // Proceed with fallback version 1
    }
  }

  const headers: Record<string, string> = {
    "Idempotency-Key": idempotencyKey || crypto.randomUUID(),
    "If-Match": formatReviewEtag(resolvedEtag),
  };

  await authApiClient(API_ENDPOINTS.backend.reviews.withdraw(reviewId), {
    method: "POST",
    headers,
    json: { reason: reason?.trim() || null },
  });

  invalidateReviewSummaryCache();
}

export async function getReviewMediaAccess(
  reviewId: string,
  mediaId: string,
): Promise<string | null> {
  try {
    const data = await authApiClientJson<ReviewMediaAccessResponse | string>(
      API_ENDPOINTS.backend.reviews.mediaAccess(reviewId, mediaId),
      { cache: "no-store" },
    );
    if (typeof data === "string") {
      return data;
    }
    if (data && typeof data === "object") {
      return (
        data.url ||
        data.accessUrl ||
        data.previewUrl ||
        data.signedUrl ||
        null
      );
    }
    return null;
  } catch {
    return null;
  }
}

export async function createReview(
  payload: CreateReviewRequest,
  idempotencyKey?: string,
): Promise<{ reviewId: string; etag: string }> {
  const response = await authApiClient(API_ENDPOINTS.backend.reviews.create, {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey || crypto.randomUUID(),
    },
    json: payload,
  });

  const rawEtag =
    response.headers.get("ETag") || response.headers.get("etag");
  let bodyJson: {
    id?: string;
    reviewId?: string;
    version?: number;
    etag?: string;
  } | null = null;
  try {
    bodyJson = (await response.json()) as {
      id?: string;
      reviewId?: string;
      version?: number;
      etag?: string;
    };
  } catch {
    // some endpoints return 200 without json body
  }

  const reviewId =
    bodyJson?.id ||
    bodyJson?.reviewId ||
    response.headers.get("Location")?.split("/").pop() ||
    "";

  const etag = formatReviewEtag(
    rawEtag ?? bodyJson?.etag,
    bodyJson?.version ?? 1,
  );

  return { reviewId, etag };
}

export async function attachReviewMedia(
  reviewId: string,
  mediaId: string,
  etag?: string | null,
  mediaType = "IMAGE",
): Promise<{ etag: string }> {
  const previousEtag = formatReviewEtag(etag);
  const headers: Record<string, string> = {
    "If-Match": previousEtag,
  };

  const response = await authApiClient(
    API_ENDPOINTS.backend.reviews.media(reviewId),
    {
      method: "POST",
      headers,
      json: { mediaId, mediaType },
    },
  );

  const nextRawEtag =
    response.headers.get("ETag") || response.headers.get("etag");
  return {
    etag: nextRawEtag
      ? formatReviewEtag(nextRawEtag)
      : incrementReviewEtag(previousEtag),
  };
}

export async function deleteReviewMedia(
  reviewId: string,
  mediaId: string,
  etag?: string | null,
): Promise<{ etag: string }> {
  const previousEtag = formatReviewEtag(etag);
  const headers: Record<string, string> = {
    "If-Match": previousEtag,
  };

  const response = await authApiClient(
    API_ENDPOINTS.backend.reviews.deleteMedia(reviewId, mediaId),
    {
      method: "DELETE",
      headers,
    },
  );

  const nextRawEtag =
    response.headers.get("ETag") || response.headers.get("etag");
  return {
    etag: nextRawEtag
      ? formatReviewEtag(nextRawEtag)
      : incrementReviewEtag(previousEtag),
  };
}

export async function reportReview(
  reviewId: string,
  reason: string,
  idempotencyKey?: string,
): Promise<void> {
  await authApiClient(API_ENDPOINTS.backend.reviews.report(reviewId), {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey || crypto.randomUUID(),
    },
    json: { reason: reason.trim() },
  });
}

export type SubmitReviewWithMediaParams = {
  orderId: string;
  itemId: string;
  rating: number;
  comment?: string | null;
  mediaIds?: string[];
};

export async function submitReviewWithMedia(
  params: SubmitReviewWithMediaParams,
): Promise<{ reviewId: string }> {
  const { reviewId, etag } = await createReview({
    orderId: params.orderId,
    itemId: params.itemId,
    rating: params.rating,
    comment: params.comment?.trim() || null,
  });

  if (params.mediaIds?.length && reviewId) {
    let currentEtag = etag;
    for (const mediaId of params.mediaIds) {
      try {
        const attachRes = await attachReviewMedia(
          reviewId,
          mediaId,
          currentEtag,
        );
        if (attachRes.etag) {
          currentEtag = attachRes.etag;
        }
      } catch (err) {
        console.error("Failed to attach media to review", mediaId, err);
      }
    }
  }

  invalidateReviewSummaryCache();
  return { reviewId };
}

export type UpdateReviewWithMediaParams = {
  reviewId: string;
  rating: number;
  comment?: string | null;
  etag?: string | null;
  addedMediaIds?: string[];
  removedMediaIds?: string[];
};

export async function updateReviewWithMedia(
  params: UpdateReviewWithMediaParams,
): Promise<void> {
  let currentEtag = params.etag;
  if (!currentEtag) {
    try {
      const detail = await getReviewDetail(params.reviewId);
      currentEtag = detail.etag;
    } catch {
      // Proceed even if detail fetch fails
    }
  }

  const updateRes = await updateReview(
    params.reviewId,
    {
      rating: params.rating,
      comment: params.comment?.trim() || null,
    },
    currentEtag,
  );
  if (updateRes.etag) {
    currentEtag = updateRes.etag;
  }

  if (params.removedMediaIds?.length) {
    for (const mediaId of params.removedMediaIds) {
      try {
        const delRes = await deleteReviewMedia(
          params.reviewId,
          mediaId,
          currentEtag,
        );
        if (delRes.etag) {
          currentEtag = delRes.etag;
        }
      } catch (err) {
        console.error("Failed to remove media from review", mediaId, err);
      }
    }
  }

  if (params.addedMediaIds?.length) {
    for (const mediaId of params.addedMediaIds) {
      try {
        const attachRes = await attachReviewMedia(
          params.reviewId,
          mediaId,
          currentEtag,
        );
        if (attachRes.etag) {
          currentEtag = attachRes.etag;
        }
      } catch (err) {
        console.error("Failed to attach media to review", mediaId, err);
      }
    }
  }

  invalidateReviewSummaryCache();
}
