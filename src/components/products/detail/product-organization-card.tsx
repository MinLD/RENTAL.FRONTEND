"use client";

import { useEffect, useState } from "react";
import { Building2, Mail, Phone, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SupplierReviewsDialog } from "@/components/reviews/supplier-reviews-dialog";
import { getReviewSummary } from "@/services/review-service";
import type { SupplierContactResponse } from "@/types/organization";
import type { ReviewSummaryResponse } from "@/types/review";

export function ProductOrganizationCard({
  organization,
  supplierId,
  initialSummary = null,
}: {
  organization: SupplierContactResponse;
  supplierId?: string | null;
  initialSummary?: ReviewSummaryResponse | null;
}) {
  const name = organization.name || "Đối tác cho thuê DPU";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(
    initialSummary,
  );
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  useEffect(() => {
    if (!supplierId || initialSummary) return;
    let isMounted = true;
    getReviewSummary("supplier", supplierId)
      .then((res) => {
        if (isMounted && res) {
          setSummary(res);
        }
      })
      .catch(() => {
        // Ignore error
      });
    return () => {
      isMounted = false;
    };
  }, [initialSummary, supplierId]);

  const hasRating =
    summary && summary.averageRating !== null && summary.averageRating > 0;

  return (
    <section
      aria-label="Thông tin tổ chức cho thuê"
      className="bg-card p-4 sm:px-6 sm:py-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Tấm ảnh / Avatar tổ chức */}
          <Avatar className="size-13 shrink-0 rounded-xl border border-border shadow-xs sm:size-14">
            {organization.logoUrl ? (
              <AvatarImage alt={name} src={organization.logoUrl} />
            ) : null}
            <AvatarFallback className="rounded-xl bg-primary/10 text-base font-bold text-primary sm:text-lg">
              {initials || <Building2 className="size-6" />}
            </AvatarFallback>
          </Avatar>

          {/* Khối bên phải ảnh: Tên tổ chức ở trên + Thông tin liên hệ nằm ngay dưới */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                {name}
              </h2>
              {hasRating ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  <Star
                    className="size-3.5 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                  <span>{Number(summary.averageRating).toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({summary.reviewCount})
                  </span>
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
              {organization.contactPhone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-primary"
                  />
                  <strong className="font-semibold text-foreground">
                    Hotline:
                  </strong>
                  <a
                    className="hover:text-primary hover:underline"
                    href={`tel:${organization.contactPhone}`}
                  >
                    {organization.contactPhone}
                  </a>
                </span>
              ) : null}
              {organization.contactEmail ? (
                <span className="inline-flex items-center gap-1.5">
                  <Mail
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-primary"
                  />
                  <strong className="font-semibold text-foreground">
                    Email:
                  </strong>
                  <a
                    className="hover:text-primary hover:underline"
                    href={`mailto:${organization.contactEmail}`}
                  >
                    {organization.contactEmail}
                  </a>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {supplierId ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setIsReviewsOpen(true)}
            className="rounded-lg text-xs"
          >
            <Star
              className="mr-1.5 size-3.5 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            <span>Đánh giá đối tác</span>
          </Button>
        ) : null}
      </div>

      {supplierId ? (
        <SupplierReviewsDialog
          supplierId={supplierId}
          supplierName={name}
          open={isReviewsOpen}
          onOpenChange={setIsReviewsOpen}
        />
      ) : null}
    </section>
  );
}
