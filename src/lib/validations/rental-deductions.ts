import { z } from "zod";

export const renterDeductionDecisionSchema = z.enum(["ACCEPT", "DISPUTE"]);

export const submitDeductionSchema = z.object({
  deductionAmount: z.number().positive("Số tiền khấu trừ phải lớn hơn 0."),
  damageDescription: z.string().trim().min(1, "Vui lòng nhập mô tả hư hại.")
    .max(2000, "Mô tả tối đa 2.000 ký tự.")
    .nullable()
    .optional(),
  evidenceMediaIds: z.array(z.string().uuid("Media ID không hợp lệ."))
    .max(10, "Tối đa 10 ảnh bằng chứng.")
    .nullable()
    .optional(),
  affectedAssetIds: z.array(z.string().uuid("Asset ID không hợp lệ."))
    .nullable()
    .optional(),
});

export const respondDeductionSchema = z.object({
  decision: renterDeductionDecisionSchema,
  disputeReason: z.string().trim()
    .max(2000, "Lý do khiếu nại tối đa 2.000 ký tự.")
    .nullable()
    .optional(),
  evidenceMediaIds: z.array(z.string().uuid("Media ID không hợp lệ."))
    .max(10, "Tối đa 10 ảnh bằng chứng.")
    .nullable()
    .optional(),
}).refine(
  (data) => {
    if (data.decision === "DISPUTE") {
      return Boolean(data.disputeReason && data.disputeReason.trim().length > 0);
    }
    return true;
  },
  {
    message: "Vui lòng nhập lý do khiếu nại đề nghị trừ cọc.",
    path: ["disputeReason"],
  },
);

export const resolveDisputeSchema = z.object({
  finalDeductionAmount: z.number().nonnegative("Số tiền khấu trừ không được âm."),
  decisionNote: z.string().trim()
    .min(1, "Vui lòng nhập ghi chú quyết định xử lý.")
    .max(2000, "Ghi chú tối đa 2.000 ký tự.")
    .nullable()
    .optional(),
  resolutionMediaIds: z.array(z.string().uuid("Media ID không hợp lệ."))
    .max(10, "Tối đa 10 ảnh bằng chứng.")
    .nullable()
    .optional(),
});
