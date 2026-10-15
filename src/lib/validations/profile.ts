import { z } from "zod";
import { FULL_NAME_MAX_LENGTH } from "@/config/profile";

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
  fullName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ và tên.")
    .max(FULL_NAME_MAX_LENGTH, `Họ và tên không được quá ${FULL_NAME_MAX_LENGTH} ký tự.`),
  identityNumber: optionalText.refine(
    (value) => !value || /^\d{12}$/.test(value),
    "CCCD/CMND phải gồm 12 chữ số.",
  ),
  phoneNumber: optionalText.refine(
    (value) => !value || vietnamPhoneRegex.test(value.replace(/\s/g, "")),
    "Số điện thoại không hợp lệ.",
  ),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
