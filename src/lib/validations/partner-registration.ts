import { z } from "zod";

const guidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emptyGuid = "00000000-0000-0000-0000-000000000000";

export const organizationLogoMediaIdSchema = z
  .string()
  .regex(guidRegex, "Mã ảnh logo không hợp lệ.")
  .refine((value) => value !== emptyGuid, "Mã ảnh logo không hợp lệ.");

export const businessInformationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên doanh nghiệp.")
    .max(150, "Tên doanh nghiệp không được quá 150 ký tự."),
  type: z.literal(1, { error: "Loại tổ chức phải là nhà cung cấp." }),
  taxCode: z
    .string()
    .trim()
    .regex(/^\d{10}(-\d{3})?$/, "Mã số thuế phải gồm 10 số hoặc 10 số-3 số."),
  establishedDate: z.union([
    z.literal(""),
    z.iso.date("Ngày thành lập phải là ngày hợp lệ theo định dạng YYYY-MM-DD."),
  ]),
  website: z
    .string()
    .trim()
    .max(500, "Website không được quá 500 ký tự.")
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        if (!/^(https?|ftp):\/\//i.test(value)) {
          return false;
        }

        try {
          const url = new URL(value);

          return Boolean(url.hostname);
        } catch {
          return false;
        }
      },
      "Website phải là URL đầy đủ, bắt đầu bằng http://, https:// hoặc ftp://.",
    ),
  logoMediaId: organizationLogoMediaIdSchema.or(z.literal("")),
  description: z
    .string()
    .max(2000, "Giới thiệu doanh nghiệp không được quá 2.000 ký tự."),
});

export const businessLicenseMediaIdSchema = z
  .string()
  .min(1, "Vui lòng tải giấy phép kinh doanh.")
  .regex(guidRegex, "Mã tài liệu giấy phép kinh doanh không hợp lệ.")
  .refine(
    (value) => value !== emptyGuid,
    "Mã tài liệu giấy phép kinh doanh không hợp lệ.",
  );

export const legalInformationSchema = z.object({
  businessLicenseNumber: z
    .string()
    .trim()
    .max(50, "Số giấy phép kinh doanh không được quá 50 ký tự."),
  businessLicenseIssuedDate: z.union([
    z.literal(""),
    z.iso.date("Ngày cấp phải là ngày hợp lệ theo định dạng YYYY-MM-DD."),
  ]),
  businessLicenseIssuedPlace: z
    .string()
    .trim()
    .max(200, "Nơi cấp giấy phép không được quá 200 ký tự."),
  legalRepresentativeName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ và tên người đại diện.")
    .max(100, "Họ và tên người đại diện không được quá 100 ký tự."),
  legalRepresentativeCitizenId: z
    .string()
    .trim()
    .refine((value) => !value || /^\d{12}$/.test(value), {
      message: "CCCD/CMND người đại diện phải gồm đúng 12 chữ số.",
    }),
  businessLicenseDocumentMediaId: businessLicenseMediaIdSchema,
});

export const partnerRegistrationSchema = businessInformationSchema.extend(
  legalInformationSchema.shape,
);

export type PartnerRegistrationFormValues = z.infer<
  typeof partnerRegistrationSchema
>;

export const BUSINESS_INFORMATION_FIELDS = [
  "name",
  "type",
  "taxCode",
  "establishedDate",
  "website",
  "logoMediaId",
  "description",
] as const satisfies readonly (keyof PartnerRegistrationFormValues)[];

export const LEGAL_INFORMATION_FIELDS = [
  "businessLicenseNumber",
  "businessLicenseIssuedDate",
  "businessLicenseIssuedPlace",
  "legalRepresentativeName",
  "legalRepresentativeCitizenId",
  "businessLicenseDocumentMediaId",
] as const satisfies readonly (keyof PartnerRegistrationFormValues)[];
