import { z } from "zod";

export const buyNowCheckoutSchema = z.object({
  addressId: z.string().min(1, "Vui lòng chọn địa chỉ nhận thiết bị."),
  deliveryNote: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự."),
  bankCode: z.string().trim().min(1, "Vui lòng nhập mã ngân hàng.").max(50),
  accountNumber: z.string().trim().regex(/^\d{6,20}$/, "Số tài khoản phải gồm 6–20 chữ số."),
  accountHolderName: z.string().trim().min(2, "Tên chủ tài khoản cần ít nhất 2 ký tự.").max(100),
  termsAccepted: z.boolean().refine(Boolean, "Vui lòng đồng ý điều khoản thuê."),
});

export type BuyNowCheckoutValues = z.infer<typeof buyNowCheckoutSchema>;
