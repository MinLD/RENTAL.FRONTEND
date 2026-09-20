import { getCurrentUser } from "@/services/session-service";
import { AuthLinks } from "./auth-links";
import { UserMenu } from "./user-menu";

export async function HeaderAuthSlot() {
  const user = await getCurrentUser();

  if (!user) {
    return <AuthLinks />;
  }

  return <UserMenu user={user} />;
}
