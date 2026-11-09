export type ReviewRatingDistribution = {
  "1": number;
  "2": number;
  "3": number;
  "4": number;
  "5": number;
  [key: string]: number;
};

export type ReviewSummaryResponse = {
  targetType: "listing" | "supplier" | string;
  targetId: string;
  averageRating: number | null;
  reviewCount: number;
  ratingDistribution: ReviewRatingDistribution;
};

export type ReviewMediaItem = {
  mediaId: string;
  mediaType?: string | null;
  previewUrl?: string | null;
  url?: string | null;
};

export type ReviewItem = {
  id?: string;
  reviewId?: string;
  orderId?: string;
  itemId?: string;
  listingId?: string;
  supplierId?: string;
  authorId?: string;
  userId?: string;
  authorName?: string | null;
  authorMaskedName?: string | null;
  userName?: string | null;
  renterName?: string | null;
  authorAvatarUrl?: string | null;
  avatarUrl?: string | null;
  rating: number;
  comment?: string | null;
  content?: string | null;
  status?: string | null;
  createdAt?: string | null;
  createdAtUtc?: string | null;
  updatedAt?: string | null;
  updatedAtUtc?: string | null;
  media?: ReviewMediaItem[] | string[] | null;
  attachments?: ReviewMediaItem[] | null;
  mediaUrls?: string[] | null;
  helpfulCount?: number;
};

export type ReviewListPage = {
  items: ReviewItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type PendingReviewItem = {
  orderId: string;
  itemId: string;
  listingId?: string;
  equipmentListingId?: string;
  listingName?: string;
  equipmentName?: string;
  title?: string;
  thumbnailUrl?: string | null;
  completedAt?: string | null;
  completedAtUtc?: string | null;
};

export type PendingReviewsPage = {
  items: PendingReviewItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type CreateReviewRequest = {
  orderId: string;
  itemId: string;
  rating: number;
  comment?: string | null;
};

export type UpdateReviewRequest = {
  rating: number;
  comment?: string | null;
};

export type WithdrawReviewRequest = {
  reason?: string | null;
};

export type AttachMediaRequest = {
  mediaId: string;
  mediaType?: string | null;
};

export type CreateReviewReportRequest = {
  reason?: string | null;
};

export type ResolveReviewReportRequest = {
  resolution?: string | null;
};

export type AdminModerationRequest = {
  reason?: string | null;
};
