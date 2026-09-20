import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email.")
    .email("Email không hợp lệ."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    acceptTerms: z.boolean().refine((value) => value, {
      message: "Vui lòng đồng ý với điều khoản sử dụng.",
    }),
    accountType: z.enum(["customer", "supplier"]),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu."),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email.")
      .email("Email không hợp lệ."),
    name: z.string().trim().min(1, "Vui lòng nhập họ và tên hoặc tên doanh nghiệp."),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
