"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { OrganizationStatusView } from "@/components/partner/organization-status-view";
import { PartnerRegistrationView } from "@/components/partner/partner-registration-view";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/services/api-client";
import { getMyOrganization, getOrganization } from "@/services/organization-service";
import {
  ORGANIZATION_STATUS,
  type OrganizationApplication,
  type OrganizationResponse,
} from "@/types/organization";

type PartnerViewProps = {
  initialOrganization: OrganizationResponse | null;
  initialError?: string;
};

export function PartnerView({
  initialOrganization,
  initialError = "",
}: PartnerViewProps) {
  const router = useRouter();
  const [organization, setOrganization] = useState<OrganizationApplication | null>(initialOrganization);
  const [editingOrganization, setEditingOrganization] = useState<OrganizationResponse | null>(null);
  const [error, setError] = useState(initialError);
  const [isLoading, setIsLoading] = useState(false);
  const requestInProgress = useRef(false);

  function handleSubmitted(application: OrganizationApplication) {
    setOrganization(application);
    setEditingOrganization(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function loadOrganization(edit = false) {
    if (requestInProgress.current) return;
    requestInProgress.current = true;
    setIsLoading(true);
    setError("");
    try {
      const profile = edit && organization
        ? await getOrganization(organization.id)
        : await getMyOrganization();
      // Never reopen registration if a previously known application cannot be found.
      if (!profile && organization) throw new Error("Existing organization was not found.");
      if (edit && profile?.id !== organization?.id) throw new Error("Organization ID mismatch.");
      setOrganization(profile);
      if (edit && profile?.status === ORGANIZATION_STATUS.rejected) {
        setEditingOrganization(profile);
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        router.replace("/login");
        return;
      }
      setError(edit
        ? "Không thể tải hồ sơ để chỉnh sửa. Vui lòng thử lại."
        : "Không thể kiểm tra trạng thái hồ sơ. Vui lòng thử lại.");
    } finally {
      requestInProgress.current = false;
      setIsLoading(false);
    }
  }

  if (editingOrganization || (!organization && !error && !isLoading)) {
    return (
      <PartnerRegistrationView
        initialOrganization={editingOrganization ?? undefined}
        onCancel={editingOrganization ? () => setEditingOrganization(null) : undefined}
        onSubmitted={handleSubmitted}
      />
    );
  }

  if (organization) {
    return (
      <OrganizationStatusView
        error={error}
        isRefreshing={isLoading}
        onEdit={() => void loadOrganization(true)}
        onRefresh={() => void loadOrganization()}
        organization={organization}
      />
    );
  }

  return (
    <section aria-busy={isLoading} className="mx-auto flex min-h-[480px] max-w-md flex-col items-center justify-center gap-4 text-center">
      {isLoading ? (
        <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-primary" />
      ) : (
        <CircleAlert aria-hidden="true" className="size-8 text-error" />
      )}
      <h1 className="text-xl font-bold text-foreground">
        {isLoading ? "Đang kiểm tra hồ sơ" : "Chưa thể tải hồ sơ"}
      </h1>
      {error && <p className="text-sm text-muted-foreground" role="alert">{error}</p>}
      <Button
        disabled={isLoading}
        onClick={() => void loadOrganization()}
        type="button"
        variant="secondary"
      >
        {isLoading ? "Đang kiểm tra..." : "Thử lại"}
      </Button>
    </section>
  );
}
