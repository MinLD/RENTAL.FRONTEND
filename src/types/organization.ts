export type OrganizationRegistrationRequest = {
  name: string;
  type: 1;
  taxCode: string;
  legalRepresentativeName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  province: string;
  ward: string;
  businessLicenseDocumentMediaId: string;
  businessLicenseNumber: string | null;
  businessLicenseIssuedDate: string | null;
  businessLicenseIssuedPlace: string | null;
  establishedDate: string | null;
  legalRepresentativeCitizenId: string | null;
  website: string | null;
  logoMediaId: string | null;
  description: string | null;
};

export type OrganizationRegisteredResponse = {
  accountId: string;
  organizationId: string;
  slug: string;
  status: 0 | 1 | 2 | 3;
};
