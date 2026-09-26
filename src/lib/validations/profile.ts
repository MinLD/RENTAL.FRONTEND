import { z } from "zod";

const optionalText = z.string().trim().optional();
const vietnamPhoneRegex = /^(0\d{9}|\+84\d{9})$/;

export const profileSchema = z.object({
  dateOfBirth: optionalText.refine(
    (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "Ngày sinh không hợp lệ.",
  ),
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email.")
    .email("Email không hợp lệ."),
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên."),
  identityNumber: optionalText,
  phoneNumber: optionalText.refine(
    (value) => !value || vietnamPhoneRegex.test(value.replace(/\s/g, "")),
    "Số điện thoại không hợp lệ.",
  ),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const completeProfileSchema = z.object({
  citizenId: z
    .string()
    .trim()
    .min(9, "CCCD/CMND phải có ít nhất 9 số.")
    .max(12, "CCCD/CMND không được quá 12 số.")
    .regex(/^\d+$/, "CCCD/CMND chỉ được gồm chữ số."),
  dateOfBirth: z
    .string()
    .trim()
    .min(1, "Vui lòng chọn ngày sinh.")
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Ngày sinh không hợp lệ.",
    }),
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên."),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập số điện thoại.")
    .refine((value) => vietnamPhoneRegex.test(value.replace(/\s/g, "")), {
      message: "Số điện thoại không hợp lệ.",
    }),
});

export type CompleteProfileFormValues = z.infer<
  typeof completeProfileSchema
>;
