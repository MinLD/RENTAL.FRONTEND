import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  partnerRegistrationSchema,
  type PartnerRegistrationFormValues,
} from "@/lib/validations/partner-registration";
import { organizationResponseSchema } from "@/lib/validations/organization";
import { authApiClient, authApiClientJson } from "@/services/api-client";
import type {
  OrganizationRegisteredResponse,
  OrganizationRegistrationRequest,
  OrganizationResponse,
} from "@/types/organization";

function nullIfBlank(value: string) {
  return value.trim() || null;
}

export async function getMyOrganization(
  signal?: AbortSignal,
): Promise<OrganizationResponse | null> {
  const response = await authApiClient(API_ENDPOINTS.backend.organizations.mine, {
    cache: "no-store",
    signal,
  });
  if (response.status === 204) return null;
  if (response.status !== 200) throw new Error("Unexpected organization response.");
  return organizationResponseSchema.parse(await response.json());
}

export async function getOrganization(id: string): Promise<OrganizationResponse> {
  const data = await authApiClientJson<unknown>(API_ENDPOINTS.backend.organizations.detail(id), {
    cache: "no-store",
  });
  return organizationResponseSchema.parse(data);
}

export async function updateOrganizationProfile(
  id: string,
  values: PartnerRegistrationFormValues,
) {
  const payload = buildOrganizationRegistrationRequest(values);
  const { type: organizationType, ...profile } = payload;
  void organizationType;
  const data = await authApiClientJson<unknown>(API_ENDPOINTS.backend.organizations.profile(id), {
    json: profile,
    method: "PUT",
  });
  return organizationResponseSchema.parse(data);
}

export function buildOrganizationRegistrationRequest(
  values: PartnerRegistrationFormValues,
): OrganizationRegistrationRequest {
  const data = partnerRegistrationSchema.parse(values);
  return {
    name: data.name,
    type: 1,
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
}

export function registerOrganization(values: PartnerRegistrationFormValues) {
  return authApiClientJson<OrganizationRegisteredResponse>(
    API_ENDPOINTS.backend.organizations.register,
    { json: buildOrganizationRegistrationRequest(values), method: "POST" },
  );
}
