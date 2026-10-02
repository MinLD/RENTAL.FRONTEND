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
  status: number;
  createdAtUtc?: string | null;
  submittedAtUtc?: string | null;
};

export const ORGANIZATION_STATUS = {
  pending: 0,
  active: 1,
  rejected: 2,
  suspended: 3,
} as const;

export type OrganizationApplication = {
  id: string;
  status: number;
  createdAtUtc?: string | null;
  submittedAtUtc?: string | null;
  rejectionReason?: string | null;
};

export type OrganizationResponse = OrganizationApplication & {
  name?: string | null;
  slug?: string | null;
  type?: number;
  taxCode?: string | null;
  legalRepresentativeName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  province?: string | null;
  ward?: string | null;
  businessLicenseDocumentMediaId?: string | null;
  businessLicenseDocumentUrl?: string | null;
  businessLicenseDocumentUrlExpiresAtUtc?: string | null;
  businessLicenseNumber?: string | null;
  businessLicenseIssuedDate?: string | null;
  businessLicenseIssuedPlace?: string | null;
  establishedDate?: string | null;
  website?: string | null;
  logoMediaId?: string | null;
  logoUrl?: string | null;
  description?: string | null;
};
