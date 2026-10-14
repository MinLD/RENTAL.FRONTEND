export const EQUIPMENT_AVAILABILITY_DEBOUNCE_MS = 400;

export const CALENDAR_BLOCK_REASONS = [
  "Maintenance",
  "OwnerReserved",
  "Inspection",
  "Other",
] as const;

export const CALENDAR_BLOCK_REASON_OPTIONS = [
  { value: "Maintenance", code: "1", label: "Bảo trì" },
  { value: "OwnerReserved", code: "2", label: "Dùng nội bộ" },
  { value: "Inspection", code: "3", label: "Kiểm định" },
  { value: "Other", code: "4", label: "Khác" },
] as const;
