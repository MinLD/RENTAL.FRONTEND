import "server-only";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  DEFAULT_REVIEW_PAGE_SIZE,
  createEmptyReviewSummary,
} from "@/services/review-service";
import { serverApi } from "@/services/server-api";
import type {
  PendingReviewsPage,
  RenterReputationResponse,
  ReviewListPage,
  ReviewSummaryResponse,
} from "@/types/review";
import { normalizeReviewListPage } from "@/utils/review";

export type InitialAccountReviewsData = {
  myReviews: ReviewListPage;
  pendingReviews: PendingReviewsPage;
  reputation: RenterReputationResponse | null;
};

export type InitialProductReviewsData = {
  summary: ReviewSummaryResponse;
  reviews: ReviewListPage;
  supplierSummary: ReviewSummaryResponse | null;
};

const EMPTY_MY_REVIEWS: ReviewListPage = {
  items: [],
  page: 1,
  pageSize: DEFAULT_REVIEW_PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
};

const EMPTY_PENDING_REVIEWS: PendingReviewsPage = {
  items: [],
  page: 1,
  pageSize: 50,
  totalCount: 0,
  totalPages: 0,
};

export function createEmptyAccountReviewsData(): InitialAccountReviewsData {
  return {
    myReviews: EMPTY_MY_REVIEWS,
    pendingReviews: EMPTY_PENDING_REVIEWS,
    reputation: null,
  };
}

export async function getInitialAccountReviewsOnServer(): Promise<InitialAccountReviewsData> {
  const [myReviews, pendingReviews, reputation] = await Promise.all([
    fetchMyReviewsOnServer(1, DEFAULT_REVIEW_PAGE_SIZE),
    fetchPendingReviewsOnServer(1, 50),
    fetchMyReputationOnServer(),
  ]);

  return {
    myReviews,
    pendingReviews,
    reputation,
  };
}

export async function getInitialProductReviewsOnServer(
  listingId: string,
  supplierId?: string | null,
): Promise<InitialProductReviewsData> {
  const [summary, reviews, supplierSummary] = await Promise.all([
    fetchReviewSummaryOnServer("listing", listingId),
    fetchListingReviewsOnServer(listingId, 1, DEFAULT_REVIEW_PAGE_SIZE),
    supplierId
      ? fetchReviewSummaryOnServer("supplier", supplierId)
      : Promise.resolve(null),
  ]);

  return {
    summary,
    reviews,
    supplierSummary,
  };
}

async function fetchMyReviewsOnServer(
  page: number,
  pageSize: number,
): Promise<ReviewListPage> {
  try {
    const response = await serverApi(
      API_ENDPOINTS.backend.reviews.my({ page, pageSize }),
    );
    if (!response.ok) return EMPTY_MY_REVIEWS;
    const data = (await response.json()) as ReviewListPage;
    return normalizeReviewListPage(data, page, pageSize);
  } catch {
    return EMPTY_MY_REVIEWS;
  }
}

async function fetchPendingReviewsOnServer(
  page: number,
  pageSize: number,
): Promise<PendingReviewsPage> {
  try {
    const response = await serverApi(
      API_ENDPOINTS.backend.reviews.pending({ page, pageSize }),
    );
    if (!response.ok) return EMPTY_PENDING_REVIEWS;
    const data = (await response.json()) as PendingReviewsPage;
    return data ?? EMPTY_PENDING_REVIEWS;
  } catch {
    return EMPTY_PENDING_REVIEWS;
  }
}

async function fetchMyReputationOnServer(): Promise<RenterReputationResponse | null> {
  try {
    const response = await serverApi(API_ENDPOINTS.backend.reviews.myReputation);
    if (!response.ok) return null;
    const data = (await response.json()) as RenterReputationResponse;
    return data ?? null;
  } catch {
    return null;
  }
}

async function fetchReviewSummaryOnServer(
  targetType: string,
  targetId: string,
): Promise<ReviewSummaryResponse> {
  try {
    const response = await serverApi(
      API_ENDPOINTS.backend.reviews.summary(targetType, targetId),
    );
    if (!response.ok) {
      return createEmptyReviewSummary(targetType, targetId);
    }
    const data = (await response.json()) as ReviewSummaryResponse;
    return data ?? createEmptyReviewSummary(targetType, targetId);
  } catch {
    return createEmptyReviewSummary(targetType, targetId);
  }
}

async function fetchListingReviewsOnServer(
  listingId: string,
  page: number,
  pageSize: number,
): Promise<ReviewListPage> {
  try {
    const response = await serverApi(
      API_ENDPOINTS.backend.reviews.byListing(listingId, { page, pageSize }),
    );
    if (!response.ok) return EMPTY_MY_REVIEWS;
    const data = (await response.json()) as ReviewListPage;
    return normalizeReviewListPage(data, page, pageSize);
  } catch {
    return EMPTY_MY_REVIEWS;
  }
}
