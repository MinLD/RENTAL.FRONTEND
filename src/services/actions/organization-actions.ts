"use server";

import { revalidatePath } from "next/cache";

import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  partnerRegistrationSchema,
  type PartnerRegistrationFormValues,
} from "@/lib/validations/partner-registration";
import { organizationResponseSchema } from "@/lib/validations/organization";
import { ApiInputError, type ApiResult } from "@/services/api-error";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import type { OrganizationResponse } from "@/types/organization";

function nullIfBlank(value?: string | null) {
  return value?.trim() || null;
}

export async function updateOwnOrganizationAction(
  organizationId: string,
  values: PartnerRegistrationFormValues,
): Promise<ApiResult<OrganizationResponse>> {
  return serverApiResult(async () => {
    const parsed = partnerRegistrationSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".");
        (fieldErrors[field] ??= []).push(issue.message);
      }
      throw new ApiInputError(
        "Vui lòng kiểm tra lại thông tin tổ chức.",
        fieldErrors,
      );
    }

    const data = parsed.data;
    const payload = {
      name: data.name,
      taxCode: data.taxCode,
      legalRepresentativeName: data.legalRepresentativeName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      address: data.address,
      province: data.province,
      ward: data.ward,
      businessLicenseDocumentMediaId: data.businessLicenseDocumentMediaId,
      businessLicenseNumber: nullIfBlank(data.businessLicenseNumber),
      businessLicenseIssuedDate: nullIfBlank(data.businessLicenseIssuedDate),
      businessLicenseIssuedPlace: nullIfBlank(data.businessLicenseIssuedPlace),
      establishedDate: nullIfBlank(data.establishedDate),
      legalRepresentativeCitizenId: nullIfBlank(data.legalRepresentativeCitizenId),
      website: nullIfBlank(data.website),
      logoMediaId: nullIfBlank(data.logoMediaId),
      description: nullIfBlank(data.description),
    };

    const response = await serverApiJson<unknown>(
      API_ENDPOINTS.backend.organizations.profile(organizationId),
      "Không thể cập nhật hồ sơ tổ chức.",
      {
        method: "PUT",
        json: payload,
      },
    );

    const updated = organizationResponseSchema.parse(response);
    revalidatePath("/own/account");
    revalidatePath("/partner");
    return updated;
  });
}
