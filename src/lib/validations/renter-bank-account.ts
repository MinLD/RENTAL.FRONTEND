import { z } from "zod";

export const renterBankAccountSchema = z.object({
  bankCode: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập mã ngân hàng.")
    .max(50, "Mã ngân hàng tối đa 50 ký tự."),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/, "Số tài khoản phải gồm 6–20 chữ số."),
  accountHolderName: z
    .string()
    .trim()
    .min(2, "Tên chủ tài khoản cần ít nhất 2 ký tự.")
    .max(100, "Tên chủ tài khoản tối đa 100 ký tự."),
});

export type RenterBankAccountFormData = z.infer<typeof renterBankAccountSchema>;
