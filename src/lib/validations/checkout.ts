import { z } from "zod";

export const buyNowCheckoutSchema = z.object({
  addressId: z.string().min(1, "Vui lòng chọn địa chỉ nhận thiết bị."),
  deliveryNote: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự."),
  bankAccountId: z.string().min(1, "Vui lòng chọn tài khoản nhận hoàn tiền."),
  termsAccepted: z.boolean().refine(Boolean, "Vui lòng đồng ý điều khoản thuê."),
});

export type BuyNowCheckoutValues = z.infer<typeof buyNowCheckoutSchema>;
