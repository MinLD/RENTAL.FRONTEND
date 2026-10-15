import type { AuthUser } from "@/types/auth";

export type ProfileCompletion = {
  isComplete: boolean;
  missingFields: string[];
};

export function getProfileCompletion(user: Pick<
  AuthUser,
  "maskedCitizenId" | "phoneNumber" | "dateOfBirth" | "isProfileCompleted"
>): ProfileCompletion {
  const missingFields: string[] = [];

  if (!user.maskedCitizenId?.trim()) missingFields.push("CCCD/CMND");
  if (!user.phoneNumber?.trim()) missingFields.push("Số điện thoại");
  if (!user.dateOfBirth?.trim()) missingFields.push("Ngày sinh");
  if (!user.isProfileCompleted && missingFields.length === 0) {
    missingFields.push("Thông tin hồ sơ cá nhân");
  }

  return {
    isComplete: user.isProfileCompleted && missingFields.length === 0,
    missingFields,
  };
}
