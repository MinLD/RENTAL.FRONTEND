import { z } from "zod";

const optionalText = z.string().nullable().optional();

// A malformed 200 must never be interpreted as permission to register again.
export const organizationResponseSchema = z.object({
  id: z.uuid(),
  status: z.number().int(),
  name: optionalText,
  slug: optionalText,
  type: z.number().int().optional(),
  createdAtUtc: optionalText,
  submittedAtUtc: optionalText,
  rejectionReason: optionalText,
  taxCode: optionalText,
  legalRepresentativeName: optionalText,
  contactEmail: optionalText,
  contactPhone: optionalText,
  address: optionalText,
  province: optionalText,
  ward: optionalText,
  businessLicenseDocumentMediaId: optionalText,
  businessLicenseDocumentUrl: optionalText,
  businessLicenseDocumentUrlExpiresAtUtc: optionalText,
  businessLicenseNumber: optionalText,
  businessLicenseIssuedDate: optionalText,
  businessLicenseIssuedPlace: optionalText,
  establishedDate: optionalText,
  website: optionalText,
  logoMediaId: optionalText,
  logoUrl: optionalText,
  description: optionalText,
});
