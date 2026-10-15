"use client";

import { CircleAlert, IdCard, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import { OrganizationStatusView } from "@/components/partner/organization-status-view";
import { PartnerRegistrationView } from "@/components/partner/partner-registration-view";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/services/api-error";
import {
  getMyOrganization,
  getOrganization,
} from "@/services/organization-service";
import {
  ORGANIZATION_STATUS,
  type OrganizationApplication,
  type OrganizationResponse,
} from "@/types/organization";
import { authPageHref } from "@/utils/auth-redirect";
import type { ProfileCompletion } from "@/utils/profile-completion";
import { withReturnTo } from "@/utils/return-to";

type PartnerViewProps = {
  initialOrganization: OrganizationResponse | null;
  initialError?: string;
  profileCompletion: ProfileCompletion;
};

export function PartnerView({
  initialOrganization,
  initialError = "",
  profileCompletion,
}: PartnerViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const profileUpdateHref = withReturnTo(
    "/account",
    `${pathname}${searchParams.size ? `?${searchParams}` : ""}`,
  );
  const [organization, setOrganization] =
    useState<OrganizationApplication | null>(initialOrganization);
  const [editingOrganization, setEditingOrganization] =
    useState<OrganizationResponse | null>(null);
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
      const profile =
        edit && organization
          ? await getOrganization(organization.id)
          : await getMyOrganization();
      // Never reopen registration if a previously known application cannot be found.
      if (!profile && organization)
        throw new Error("Existing organization was not found.");
      if (edit && profile?.id !== organization?.id)
        throw new Error("Organization ID mismatch.");
      setOrganization(profile);
      if (edit && profile?.status === ORGANIZATION_STATUS.rejected) {
        setEditingOrganization(profile);
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace(authPageHref("/login", `${window.location.pathname}${window.location.search}${window.location.hash}`, true));
        return;
      }
      setError(
        error instanceof ApiError
          ? error.message
          : edit
            ? "Không thể tải hồ sơ để chỉnh sửa. Vui lòng thử lại."
            : "Không thể kiểm tra trạng thái hồ sơ. Vui lòng thử lại.",
      );
    } finally {
      requestInProgress.current = false;
      setIsLoading(false);
    }
  }

  if (organization && !editingOrganization) {
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

  if (!profileCompletion.isComplete) {
    return (
      <PartnerProfileRequiredView
        missingFields={profileCompletion.missingFields}
        profileUpdateHref={profileUpdateHref}
      />
    );
  }

  if (editingOrganization || (!organization && !error && !isLoading)) {
    return (
      <PartnerRegistrationView
        initialOrganization={editingOrganization ?? undefined}
        onCancel={
          editingOrganization ? () => setEditingOrganization(null) : undefined
        }
        onSubmitted={handleSubmitted}
      />
    );
  }

  return (
    <section
      aria-busy={isLoading}
      className="mx-auto flex min-h-[480px] max-w-md flex-col items-center justify-center gap-4 text-center"
    >
      {isLoading ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-8 animate-spin text-primary"
        />
      ) : (
        <CircleAlert aria-hidden="true" className="size-8 text-error" />
      )}
      <h1 className="text-xl font-bold text-foreground">
        {isLoading ? "Đang kiểm tra hồ sơ" : "Chưa thể tải hồ sơ"}
      </h1>
      {error && (
        <p className="text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}
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

function PartnerProfileRequiredView({
  missingFields,
  profileUpdateHref,
}: {
  missingFields: string[];
  profileUpdateHref: string;
}) {
  return (
    <section className="mx-auto flex min-h-[480px] max-w-lg flex-col items-center justify-center gap-5 text-center">
      <div className="flex size-14 items-center justify-center rounded-full  text-primary">
        <IdCard aria-hidden="true" className="size-7" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Cần hoàn thiện hồ sơ cá nhân
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Trước khi đăng ký tổ chức, bạn cần cập nhật đủ CCCD/CMND, số điện
          thoại và ngày sinh để hệ thống xác minh hồ sơ.
        </p>
      </div>
      <div className="w-full rounded-lg border border-border bg-background p-4 text-left">
        <p className="text-sm font-semibold text-foreground">
          Thông tin còn thiếu
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {missingFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </div>
      <Button asChild>
        <Link href={profileUpdateHref}>Cập nhật hồ sơ</Link>
      </Button>
    </section>
  );
}
