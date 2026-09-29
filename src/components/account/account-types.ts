import type { ProfileFormValues } from "@/lib/validations/profile";

export type AccountProfileInitialData = ProfileFormValues & {
  avatarMediaId?: string;
  avatarUrl?: string;
  roleLabel: string;
};
