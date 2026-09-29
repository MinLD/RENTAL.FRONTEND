export const ACCOUNT_PROFILE_UPDATED_EVENT = "dprental:account-profile-updated";

export type AccountProfileUpdatedEventDetail = {
  avatarUrl?: string;
  userId: string;
};
