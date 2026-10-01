import { z } from "zod";

import { findProvince, isProvinceWardPair } from "@/lib/locations/vietnam-divisions";

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

const contactInformationFieldsSchema = z.object({
  contactEmail: z.string().trim()
    .min(1, "Vui lòng nhập email liên hệ.")
    .email("Email liên hệ không hợp lệ.")
    .max(254, "Email liên hệ không được quá 254 ký tự."),
  contactPhone: z.string().trim()
    .regex(/^(0|\+84)\d{9}$/, "Số điện thoại phải gồm 0 và 9 số hoặc +84 và 9 số."),
  province: z.string().trim()
    .min(1, "Vui lòng chọn tỉnh / thành phố.")
    .max(100, "Tỉnh / thành phố không được quá 100 ký tự.")
    .refine((value) => !value || Boolean(findProvince(value)), "Tỉnh / thành phố không hợp lệ."),
  ward: z.string().trim()
    .min(1, "Vui lòng chọn phường / xã.")
    .max(100, "Phường / xã không được quá 100 ký tự."),
  address: z.string().trim()
    .min(1, "Vui lòng nhập địa chỉ chi tiết.")
    .max(250, "Địa chỉ chi tiết không được quá 250 ký tự."),
});

// Apply the same relationship check to the step and the full form schemas.
function validateProvinceWard(
  value: { province: string; ward: string },
  context: z.RefinementCtx,
) {
  if (value.province && value.ward && !isProvinceWardPair(value.province, value.ward)) {
    context.addIssue({
      code: "custom",
      path: ["ward"],
      message: "Phường / xã không thuộc tỉnh / thành phố đã chọn.",
    });
  }
}

export const contactInformationSchema = contactInformationFieldsSchema.superRefine(validateProvinceWard);

export const partnerRegistrationSchema = businessInformationSchema
  .extend(legalInformationSchema.shape)
  .extend(contactInformationFieldsSchema.shape)
  .superRefine(validateProvinceWard);

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

export const CONTACT_INFORMATION_FIELDS = [
  "contactEmail",
  "contactPhone",
  "province",
  "ward",
  "address",
] as const satisfies readonly (keyof PartnerRegistrationFormValues)[];
