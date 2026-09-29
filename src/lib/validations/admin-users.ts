import { z } from "zod";

export const ADMIN_USER_ROLE_OPTIONS = [
  "Admin",
  "Customer",
  "Supplier",
] as const;

export const createAdminUserSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email.")
    .email("Email không hợp lệ."),
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export const updateAdminUserSchema = z.object({
  avatarMediaId: z.string().trim().optional(),
  citizenId: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{12}$/.test(value), {
      message: "CCCD/CMND phải gồm 12 chữ số.",
    }),
  dateOfBirth: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .email("Email không hợp lệ.")
    .optional()
    .or(z.literal("")),
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên."),
  isActive: z.enum(["active", "locked"], {
    message: "Trạng thái không hợp lệ.",
  }),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^(0|\+84)\d{9}$/.test(value), {
      message: "Số điện thoại không hợp lệ.",
    }),
});

export type CreateAdminUserFormValues = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserFormValues = z.infer<typeof updateAdminUserSchema>;
