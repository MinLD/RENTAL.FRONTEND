import { Building2, ExternalLink, Globe, Mail, Phone } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SupplierContactResponse } from "@/types/organization";
import Image from "next/image";

export function ProductOrganizationCard({
  organization,
}: {
  organization: SupplierContactResponse;
}) {
  const name = organization.name || "Đối tác cho thuê DPU";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <section
      aria-label="Thông tin tổ chức cho thuê"
      className="bg-card p-4  sm:px-6 sm:py-4"
    >
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
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            {name}
          </h2>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
            {organization.contactPhone ? (
              <span className="inline-flex items-center gap-1.5">
                <Phone
                  aria-hidden="true"
                  className="size-3.5 text-primary shrink-0"
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
                  className="size-3.5 text-primary shrink-0"
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
    </section>
  );
}
