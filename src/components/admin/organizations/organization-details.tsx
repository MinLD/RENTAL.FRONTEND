"use client";

import { ExternalLink, FileText, Pencil } from "lucide-react";
import type { ReactNode } from "react";

import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { OrganizationStatusBadge } from "@/components/organization/organization-status-badge";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Button } from "@/components/ui/button";
import type { AdminOrganizationDetail } from "@/types/admin-organizations";
import {
  formatOrganizationDate,
  getOrganizationInitials,
  getOrganizationTypeLabel,
  getOrganizationWebsiteUrl,
} from "@/utils/organization";

export function OrganizationDetails({
  onRefresh,
  organization,
}: {
  onRefresh: () => void;
  organization: AdminOrganizationDetail;
}) {
  const websiteUrl = getOrganizationWebsiteUrl(organization.website);
  const documentUrl = getOrganizationWebsiteUrl(organization.businessLicenseDocumentUrl);
  const documentExpiresAt = organization.businessLicenseDocumentUrlExpiresAtUtc
    ? new Date(organization.businessLicenseDocumentUrlExpiresAtUtc).getTime()
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 rounded border border-border bg-muted/40 p-5 text-center">
        <AvatarWithSkeleton
          alt={organization.name ?? "Logo tổ chức"}
          className="size-20 rounded-lg bg-background"
          fallback={getOrganizationInitials(organization.name)}
          fallbackClassName="rounded-lg text-xl font-bold"
          src={organization.logoUrl}
        />
        <p className="break-words text-base font-bold">{organization.name || "Chưa có tên"}</p>
        <OrganizationStatusBadge status={organization.status} />
      </div>

      <DetailSection title="Thông tin doanh nghiệp">
        <div className="col-span-full">
          <TextField
            id="organization-name"
            label="Tên tổ chức"
            readOnly
            rightElement={
              <Button aria-label="Đổi tên tổ chức" disabled size="icon" title="Đổi tên tổ chức" type="button" variant="ghost">
                <Pencil className="size-4" />
              </Button>
            }
            value={organization.name || "—"}
          />
        </div>
        <DetailField id="id" label="ID tổ chức" value={organization.id} />
        <DetailField id="slug" label="Slug" value={organization.slug} />
        <DetailField id="type" label="Loại tổ chức" value={getOrganizationTypeLabel(organization.type)} />
        <DetailField id="tax-code" label="Mã số thuế" value={organization.taxCode} />
        <DetailField id="established-date" label="Ngày thành lập" value={formatOrganizationDate(organization.establishedDate, false)} />
        <DetailField id="created-date" label="Ngày tạo" value={formatOrganizationDate(organization.createdAtUtc)} />
        <div className="col-span-full">
          <TextField
            id="organization-website"
            label="Website"
            readOnly
            rightElement={websiteUrl ? (
              <Button asChild aria-label="Mở website tổ chức" size="icon" variant="ghost">
                <a href={websiteUrl} rel="noopener noreferrer" target="_blank"><ExternalLink className="size-4" /></a>
              </Button>
            ) : undefined}
            value={organization.website || "—"}
          />
        </div>
        <div className="col-span-full">
          <TextareaField id="organization-description" label="Mô tả" readOnly rows={4} value={organization.description || "—"} />
        </div>
      </DetailSection>

      <DetailSection title="Thông tin pháp lý">
        <DetailField id="representative" label="Người đại diện pháp luật" value={organization.legalRepresentativeName} />
        <DetailField id="license-number" label="Số giấy phép kinh doanh" value={organization.businessLicenseNumber} />
        <DetailField id="license-date" label="Ngày cấp giấy phép" value={formatOrganizationDate(organization.businessLicenseIssuedDate, false)} />
        <DetailField id="license-place" label="Nơi cấp giấy phép" value={organization.businessLicenseIssuedPlace} />
        <div className="col-span-full space-y-2 rounded border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase">Giấy phép kinh doanh</p>
          {documentUrl ? (
            <Button asChild size="sm" variant="secondary">
              <a
                href={documentUrl}
                onClick={(event) => {
                  if (documentExpiresAt !== null && documentExpiresAt <= Date.now()) {
                    event.preventDefault();
                    onRefresh();
                  }
                }}
                rel="noopener noreferrer"
                target="_blank"
              >
                <FileText className="size-4" />
                Xem giấy phép kinh doanh
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có liên kết xem giấy phép kinh doanh.</p>
          )}
        </div>
      </DetailSection>

      <DetailSection title="Địa chỉ và liên hệ">
        <DetailField id="email" label="Email liên hệ" value={organization.contactEmail} />
        <DetailField id="phone" label="Số điện thoại liên hệ" value={organization.contactPhone} />
        <DetailField id="province" label="Tỉnh/thành" value={organization.province} />
        <DetailField id="ward" label="Phường/xã" value={organization.ward} />
        <div className="col-span-full"><DetailField id="address" label="Địa chỉ chi tiết" value={organization.address} /></div>
      </DetailSection>

      <DetailSection title="Thông tin xét duyệt">
        <DetailField id="reviewed-date" label="Ngày duyệt/từ chối" value={formatOrganizationDate(organization.reviewedAtUtc)} />
        {organization.rejectionReason?.trim() ? (
          <div className="col-span-full">
            <TextareaField
              id="organization-rejection-reason"
              label="Lý do từ chối"
              readOnly
              rows={3}
              value={organization.rejectionReason}
            />
          </div>
        ) : null}
      </DetailSection>
    </div>
  );
}

function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function DetailField({ id, label, value }: { id: string; label: string; value?: string | null }) {
  return <TextField id={`organization-${id}`} label={label} readOnly value={value || "—"} />;
}
