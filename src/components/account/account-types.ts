import type { ProfileFormValues } from "@/lib/validations/profile";

export type AccountProfileInitialData = ProfileFormValues & {
  avatarUrl?: string;
  roleLabel: string;
};
