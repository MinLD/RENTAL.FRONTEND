"use client";

import { useRef, useState } from "react";

import type { AdminOrganizationDetail, AdminOrganizationSummary } from "@/types/admin-organizations";

export function useAdminOrganizationsController(
  fetchOrganizationDetail: (id: string) => Promise<AdminOrganizationDetail>,
) {
  const [selectedOrganization, setSelectedOrganization] = useState<AdminOrganizationSummary | null>(null);
  const [detailOrganization, setDetailOrganization] = useState<AdminOrganizationDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRequestId = useRef(0);

  async function handleViewOrganization(organization: AdminOrganizationSummary) {
    const requestId = ++detailRequestId.current;
    setSelectedOrganization(organization);
    setDetailOrganization(null);
    setDetailError(null);
    setIsLoadingDetail(true);

    try {
      const detail = await fetchOrganizationDetail(organization.id);

      if (requestId === detailRequestId.current) {
        setDetailOrganization(detail);
      }
    } catch (error) {
      if (requestId === detailRequestId.current) {
        setDetailError(error instanceof Error ? error.message : "Không thể tải chi tiết tổ chức.");
      }
    } finally {
      if (requestId === detailRequestId.current) {
        setIsLoadingDetail(false);
      }
    }
  }

  function closeDetail() {
    ++detailRequestId.current;
    setSelectedOrganization(null);
    setDetailOrganization(null);
    setDetailError(null);
    setIsLoadingDetail(false);
  }

  function refreshDetail() {
    if (selectedOrganization) {
      void handleViewOrganization(selectedOrganization);
    }
  }

  function handleOrganizationApproved(organization: AdminOrganizationDetail) {
    setDetailOrganization((currentOrganization) =>
      currentOrganization?.id === organization.id ? organization : currentOrganization,
    );
    setSelectedOrganization((currentOrganization) =>
      currentOrganization?.id === organization.id
        ? {
            ...currentOrganization,
            logoMediaId: organization.logoMediaId,
            logoUrl: organization.logoUrl,
            name: organization.name,
            province: organization.province,
            slug: organization.slug,
            status: organization.status,
            type: organization.type,
          }
        : currentOrganization,
    );
  }

  return {
    closeDetail,
    detailError,
    detailOrganization,
    handleOrganizationApproved,
    handleViewOrganization,
    isLoadingDetail,
    refreshDetail,
    selectedOrganization,
  };
}
