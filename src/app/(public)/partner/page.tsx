import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { PartnerView } from "@/components/partner/partner-view";
import { ApiClientError } from "@/services/api-client";
import { getMyOrganizationOnServer } from "@/services/organization-server-service";
import type { OrganizationResponse } from "@/types/organization";

export const metadata: Metadata = {
  title: "Đăng ký đối tác | DPRENTAL",
};

export default async function PartnerPage() {
  let organization: OrganizationResponse | null = null;
  let error = "";
  try {
    organization = await getMyOrganizationOnServer();
  } catch (cause) {
    if (cause instanceof ApiClientError && cause.status === 401)
      redirect("/login");
    error = "Không thể kiểm tra trạng thái hồ sơ. Vui lòng thử lại.";
  }
  return (
    <div className="flex flex-1 flex-col bg-background py-8 sm:py-10">
      <Container>
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-xs text-muted-foreground"
        >
          <Link className="transition-colors hover:text-primary" href="/">
            Trang chủ
          </Link>
          <span aria-hidden="true" className="mx-1.5">
            /
          </span>
          <span aria-current="page">Đối tác</span>
        </nav>

        <PartnerView
          initialError={error}
          initialOrganization={organization}
          key={
            error ||
            `${organization?.id ?? "new"}:${organization?.status ?? "new"}:${organization?.submittedAtUtc ?? ""}`
          }
        />
      </Container>
    </div>
  );
}
