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
  equipmentListingId?: string;
  listingName?: string | null;
  equipmentName?: string | null;
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
  editDeadlineUtc?: string | null;
  canEdit?: boolean;
  canWithdraw?: boolean;
  version?: number | null;
  etag?: string | null;
  media?: ReviewMediaItem[] | string[] | null;
  attachments?: ReviewMediaItem[] | null;
  mediaUrls?: string[] | null;
  helpfulCount?: number;
};

export type RenterReputationResponse = {
  renterId?: string;
  userId?: string;
  averageRating?: number | null;
  score?: number | null;
  reputationScore?: number | null;
  totalReviews?: number;
  reviewCount?: number;
  completedRentals?: number;
  tier?: string | null;
  level?: string | null;
  status?: string | null;
  updatedAt?: string | null;
  updatedAtUtc?: string | null;
};

export type ReviewMediaAccessResponse = {
  url?: string | null;
  accessUrl?: string | null;
  previewUrl?: string | null;
  signedUrl?: string | null;
  expiresAt?: string | null;
  expiresAtUtc?: string | null;
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
