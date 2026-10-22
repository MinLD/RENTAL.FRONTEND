import { z } from "zod";

export const renterAddressSchema = z.object({
  province: z.string().trim().min(1, "Vui lòng chọn tỉnh / thành phố.").max(100, "Tỉnh / thành phố không được quá 100 ký tự."),
  addressDetail: z.string().trim().min(5, "Địa chỉ chi tiết cần ít nhất 5 ký tự.").max(200, "Địa chỉ chi tiết không được quá 200 ký tự."),
  recipientName: z.string().trim().min(1, "Vui lòng nhập tên người nhận.").max(100, "Tên người nhận không được quá 100 ký tự."),
  recipientPhone: z.string().trim().regex(/^(?:0|\+84)\d{9}$/, "Số điện thoại phải bắt đầu bằng 0 hoặc +84 và có 9 chữ số phía sau."),
});
