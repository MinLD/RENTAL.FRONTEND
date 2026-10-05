import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import {
  PartnerView,
  type PartnerProfileCompletion,
} from "@/components/partner/partner-view";
import { getMyOrganizationOnServer } from "@/services/organization-server-service";
import { getCurrentUser } from "@/services/session-service";
import type { OrganizationResponse } from "@/types/organization";

export const metadata: Metadata = {
  title: "Đăng ký đối tác | DPRENTAL",
};

export default async function PartnerPage() {
  const currentUser = await getCurrentUser();
  const profileCompletion = getPartnerProfileCompletion(currentUser);
  const organization: OrganizationResponse | null = await getMyOrganizationOnServer();
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
          initialOrganization={organization}
          profileCompletion={profileCompletion}
          key={`${organization?.id ?? "new"}:${organization?.status ?? "new"}:${organization?.submittedAtUtc ?? ""}`}
        />
      </Container>
    </div>
  );
}

function getPartnerProfileCompletion(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): PartnerProfileCompletion {
  if (!user) {
    return { isComplete: true, missingFields: [] };
  }

  const missingFields: string[] = [];

  if (!user.maskedCitizenId?.trim()) {
    missingFields.push("CCCD/CMND");
  }

  if (!user.phoneNumber?.trim()) {
    missingFields.push("Số điện thoại");
  }

  if (!user.dateOfBirth?.trim()) {
    missingFields.push("Ngày sinh");
  }

  if (!user.isProfileCompleted && missingFields.length === 0) {
    missingFields.push("Thông tin hồ sơ cá nhân");
  }

  return {
    isComplete: user.isProfileCompleted && missingFields.length === 0,
    missingFields,
  };
}
