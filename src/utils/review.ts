import type {
  ReviewItem,
  ReviewListPage,
  ReviewMediaItem,
} from "@/types/review";

export function getReviewId(review: ReviewItem): string {
  return review.reviewId || review.id || "";
}

export function formatReviewEtag(
  etag?: string | number | null,
  version?: number | string | null,
): string {
  if (etag !== undefined && etag !== null && String(etag).trim() !== "") {
    const match = String(etag).match(/([1-9]\d*)/);
    if (match?.[1]) {
      return `"${match[1]}"`;
    }
  }
  if (
    version !== undefined &&
    version !== null &&
    String(version).trim() !== ""
  ) {
    const match = String(version).match(/([1-9]\d*)/);
    if (match?.[1]) {
      return `"${match[1]}"`;
    }
  }
  return '"1"';
}

export function incrementReviewEtag(etag?: string | null): string {
  const match = String(etag ?? "").match(/([1-9]\d*)/);
  const currentVersion = match?.[1] ? Number.parseInt(match[1], 10) : 1;
  return `"${currentVersion + 1}"`;
}

export function normalizeReviewItem(item: ReviewItem): ReviewItem {
  const id = item.id || item.reviewId || "";
  const etag =
    item.etag !== undefined || item.version !== undefined
      ? formatReviewEtag(item.etag, item.version)
      : undefined;
  return {
    ...item,
    id,
    reviewId: item.reviewId || id,
    ...(item.authorName || item.authorMaskedName
      ? { authorName: item.authorName || item.authorMaskedName }
      : {}),
    ...(etag ? { etag } : {}),
  };
}

export function normalizeReviewListPage(
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

export function getReviewAuthorName(review: ReviewItem): string {
  const name =
    review.authorMaskedName ||
    review.authorName ||
    review.userName ||
    review.renterName ||
    "Khách hàng ẩn danh";
  return name.trim();
}

export function getReviewAuthorAvatar(review: ReviewItem): string | null {
  return review.authorAvatarUrl || review.avatarUrl || null;
}

export function getReviewComment(review: ReviewItem): string {
  return review.comment || review.content || "";
}

export function getReviewDate(review: ReviewItem): string {
  const dateStr =
    review.createdAtUtc ||
    review.createdAt ||
    review.updatedAtUtc ||
    review.updatedAt;
  if (!dateStr) return "";
  return formatRelativeTime(dateStr);
}

export function getReviewInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return "KH";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] || "";
    const last = parts[parts.length - 1]?.[0] || "";
    return `${first}${last}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  if (diffWeek < 5) return `${diffWeek} tuần trước`;
  if (diffMonth < 12) return `${diffMonth} tháng trước`;
  return `${diffYear} năm trước`;
}

export function getReviewMediaList(
  review: ReviewItem,
): Array<{ mediaId: string; previewUrl: string }> {
  const list: Array<{ mediaId: string; previewUrl: string }> = [];

  const rawList = review.media || review.attachments || [];
  if (Array.isArray(rawList)) {
    for (const item of rawList) {
      if (typeof item === "string") {
        list.push({ mediaId: item, previewUrl: item });
      } else if (item && typeof item === "object") {
        const mediaObj = item as ReviewMediaItem;
        const mediaId = mediaObj.mediaId || "";
        const url =
          mediaObj.previewUrl ||
          mediaObj.url ||
          (mediaId ? `/api/v1/media/${encodeURIComponent(mediaId)}/content` : "");
        if (url) {
          list.push({ mediaId, previewUrl: url });
        }
      }
    }
  }

  if (Array.isArray(review.mediaUrls)) {
    for (const url of review.mediaUrls) {
      if (typeof url === "string" && !list.some((m) => m.previewUrl === url)) {
        list.push({ mediaId: url, previewUrl: url });
      }
    }
  }

  return list;
}

export function calculateStarPercentage(count: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((count / total) * 100);
}
