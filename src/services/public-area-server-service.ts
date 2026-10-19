import "server-only";

import { cookies } from "next/headers";
import { deserializePublicArea, PUBLIC_AREA_COOKIE_NAME } from "@/lib/locations/public-area";

export async function getStoredPublicArea() {
  const cookieStore = await cookies();
  return deserializePublicArea(cookieStore.get(PUBLIC_AREA_COOKIE_NAME)?.value);
}
