import { z } from "zod";

export const unitConditionSchema = z.enum(["NORMAL", "DAMAGED"]);

export const returnRequestUnitDtoSchema = z.object({
  rentalUnitAssignmentId: z.string().uuid("Assignment ID không hợp lệ."),
  mediaIds: z.array(z.string().uuid("Media ID không hợp lệ.")).optional().default([]),
});

export const createReturnRequestSchema = z.object({
  actualReturnAt: z.string().min(1, "Vui lòng chọn thời điểm trả thiết bị."),
  note: z.string().trim().max(2000, "Ghi chú tối đa 2.000 ký tự.").nullable().optional(),
  units: z.array(returnRequestUnitDtoSchema).min(1, "Vui lòng chọn ít nhất một thiết bị cần trả."),
});

export const returnUnitRequestSchema = z.object({
  rentalUnitAssignmentId: z.string().uuid("Assignment ID không hợp lệ."),
  condition: unitConditionSchema,
  description: z.string().trim().max(2000, "Mô tả tối đa 2.000 ký tự.").nullable().optional(),
  mediaIds: z.array(z.string().uuid("Media ID không hợp lệ.")).optional().default([]),
}).refine(
  (data) => {
    if (data.condition === "DAMAGED") {
      return Boolean(data.description && data.description.trim().length > 0);
    }
    return true;
  },
  {
    message: "Bắt buộc nhập mô tả khi thiết bị bị hư hỏng.",
    path: ["description"],
  },
).refine(
  (data) => {
    if (data.condition === "DAMAGED") {
      return Array.isArray(data.mediaIds) && data.mediaIds.length > 0;
    }
    return true;
  },
  {
    message: "Bắt buộc tải lên ít nhất một ảnh chụp hiện trạng khi thiết bị bị hư hỏng.",
    path: ["mediaIds"],
  },
);

export const recordReturnRequestSchema = z.object({
  actualReturnAt: z.string().min(1, "Vui lòng chọn thời điểm thực nhận thiết bị."),
  note: z.string().trim().max(2000, "Ghi chú tối đa 2.000 ký tự.").nullable().optional(),
  units: z.array(returnUnitRequestSchema).min(1, "Vui lòng chọn ít nhất một thiết bị để thu hồi."),
});

export const reportReturnIssueSchema = z.object({
  reason: z.string().trim().min(1, "Vui lòng nhập lý do báo cáo sự cố.")
    .max(500, "Lý do tối đa 500 ký tự."),
  note: z.string().trim().max(2000, "Ghi chú tối đa 2.000 ký tự.").nullable().optional(),
  mediaIds: z.array(z.string().uuid("Media ID không hợp lệ.")).max(10, "Tối đa 10 ảnh.").optional().default([]),
  assignmentIds: z.array(z.string().uuid("Assignment ID không hợp lệ.")).optional(),
});

export const adminResolveReturnRequestSchema = z.object({
  decision: z.enum(["ConfirmReceived", "RejectRequest"]),
  decisionNote: z.string().trim().min(1, "Vui lòng nhập ghi chú phân xử.")
    .max(2000, "Ghi chú tối đa 2.000 ký tự."),
  assignmentIds: z.array(z.string().uuid("Assignment ID không hợp lệ.")).min(1, "Cần chọn ít nhất một thiết bị."),
  resolutionMediaIds: z.array(z.string().uuid("Media ID không hợp lệ.")).max(10, "Tối đa 10 ảnh.").optional().default([]),
  actualReturnAt: z.string().nullable().optional(),
  units: z.array(z.object({
    rentalUnitAssignmentId: z.string().uuid(),
    condition: unitConditionSchema,
    description: z.string().trim().max(2000).nullable().optional(),
    mediaIds: z.array(z.string().uuid()).optional().default([]),
  })).nullable().optional(),
}).refine(
  (data) => {
    if (data.decision === "ConfirmReceived") {
      if (!data.actualReturnAt) return false;
      if (!data.units || data.units.length === 0) return false;
      if (data.units.length !== data.assignmentIds.length) return false;
      const unitIds = new Set(data.units.map((u) => u.rentalUnitAssignmentId));
      for (const id of data.assignmentIds) {
        if (!unitIds.has(id)) return false;
      }
    }
    return true;
  },
  {
    message: "Xác nhận thực nhận yêu cầu đầy đủ thời điểm nhận và kết quả kiểm định cho từng thiết bị.",
    path: ["units"],
  },
);
