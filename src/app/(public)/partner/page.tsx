import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { PartnerView } from "@/components/partner/partner-view";
import { getMyOrganizationOnServer } from "@/services/organization-server-service";
import { getRenterAddressesForServer } from "@/services/renter-address-server-service";
import {
  getCurrentUser,
  getCurrentUserCitizenIdOnServer,
} from "@/services/session-service";
import { serverApiResult } from "@/services/server-api";
import { getProfileCompletion } from "@/utils/profile-completion";

export const metadata: Metadata = {
  title: "Đăng ký đối tác",
};

export default async function PartnerPage() {
  const currentUser = await getCurrentUser();
  const profileCompletion = currentUser
    ? getProfileCompletion(currentUser)
    : { isComplete: true, missingFields: [] };
  const [result, userCitizenId, addressesResult] = await Promise.all([
    serverApiResult(getMyOrganizationOnServer),
    getCurrentUserCitizenIdOnServer(),
    getRenterAddressesForServer(),
  ]);
  const organization = result.success ? result.data : null;
  const addresses = addressesResult.addresses ?? [];
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const currentUserData = {
    fullName: currentUser?.fullName ?? "",
    citizenId: userCitizenId ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phoneNumber ?? defaultAddress?.recipientPhone ?? "",
    province: defaultAddress?.province ?? "",
    address: defaultAddress?.addressDetail ?? "",
  };
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
          currentUserData={currentUserData}
          initialError={result.success ? undefined : result.error.message}
          initialOrganization={organization}
          profileCompletion={profileCompletion}
          key={`${organization?.id ?? "new"}:${organization?.status ?? "new"}:${organization?.submittedAtUtc ?? ""}`}
        />
      </Container>
    </div>
  );
}
