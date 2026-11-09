import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  apiClientJson,
  authApiClient,
  authApiClientJson,
} from "@/services/api-client";
import type {
  CreateReviewRequest,
  PendingReviewsPage,
  ReviewItem,
  ReviewListPage,
  ReviewSummaryResponse,
} from "@/types/review";

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

function normalizeReviewItem(item: ReviewItem): ReviewItem {
  const id = item.id || item.reviewId || "";
  return {
    ...item,
    id,
    reviewId: item.reviewId || id,
  };
}

function normalizeReviewListPage(
  data: ReviewListPage | null | undefined,
  page: number,
  pageSize: number,
): ReviewListPage {
  if (!data || !Array.isArray(data.items)) {
    return {
      items: [],
      page,
      pageSize,
      totalCount: 0,
      totalPages: 0,
    };
  }
  return {
    ...data,
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    totalCount: data.totalCount ?? data.items.length,
    totalPages: data.totalPages ?? (data.items.length > 0 ? 1 : 0),
    items: data.items.map(normalizeReviewItem),
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
  const data = await authApiClientJson<ReviewListPage>(
    API_ENDPOINTS.backend.reviews.my({ page, pageSize }),
    { cache: "no-store" },
  );
  return normalizeReviewListPage(data, page, pageSize);
}

export async function createReview(
  payload: CreateReviewRequest,
  idempotencyKey?: string,
): Promise<{ reviewId: string; etag: string | null }> {
  const response = await authApiClient(API_ENDPOINTS.backend.reviews.create, {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey || crypto.randomUUID(),
    },
    json: payload,
  });

  const etag = response.headers.get("ETag");
  let bodyJson: { id?: string; reviewId?: string } | null = null;
  try {
    bodyJson = (await response.json()) as { id?: string; reviewId?: string };
  } catch {
    // some endpoints return 200 without json body
  }

  const reviewId =
    bodyJson?.id ||
    bodyJson?.reviewId ||
    response.headers.get("Location")?.split("/").pop() ||
    "";

  return { reviewId, etag };
}

export async function attachReviewMedia(
  reviewId: string,
  mediaId: string,
  etag?: string | null,
  mediaType = "IMAGE",
): Promise<{ etag: string | null }> {
  const headers: Record<string, string> = {};
  if (etag) {
    headers["If-Match"] = etag;
  }

  const response = await authApiClient(
    API_ENDPOINTS.backend.reviews.media(reviewId),
    {
      method: "POST",
      headers,
      json: { mediaId, mediaType },
    },
  );

  return { etag: response.headers.get("ETag") || etag || null };
}

export async function deleteReviewMedia(
  reviewId: string,
  mediaId: string,
  etag?: string | null,
): Promise<{ etag: string | null }> {
  const headers: Record<string, string> = {};
  if (etag) {
    headers["If-Match"] = etag;
  }

  const response = await authApiClient(
    API_ENDPOINTS.backend.reviews.deleteMedia(reviewId, mediaId),
    {
      method: "DELETE",
      headers,
    },
  );

  return { etag: response.headers.get("ETag") || etag || null };
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
