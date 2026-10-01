import { API_ENDPOINTS } from "@/config/api-endpoints";
import {
  partnerRegistrationSchema,
  type PartnerRegistrationFormValues,
} from "@/lib/validations/partner-registration";
import { authApiClientJson } from "@/services/api-client";
import type {
  OrganizationRegisteredResponse,
  OrganizationRegistrationRequest,
} from "@/types/organization";

function nullIfBlank(value: string) {
  return value.trim() || null;
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
