import { z } from "zod";

export const ADMIN_USER_ROLE_OPTIONS = [
  "Admin",

  "Customer",
  "Supplier",
] as const;

export const updateAdminUserSchema = z.object({
  avatarMediaId: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email.")
    .email("Email không hợp lệ."),
  name: z.string().trim().min(1, "Vui lòng nhập họ tên."),
  phone: z
    .string()
    .trim()
    .max(10, "Số điện thoại không được vượt quá 30 ký tự.")
    .regex(/^[\d\s()+.-]*$/, "Số điện thoại không hợp lệ."),
  role: z.string().trim().min(1, "Vui lòng chọn vai trò."),
  status: z.enum(["active", "locked"], {
    message: "Trạng thái không hợp lệ.",
  }),
});

export type UpdateAdminUserFormValues = z.infer<typeof updateAdminUserSchema>;
