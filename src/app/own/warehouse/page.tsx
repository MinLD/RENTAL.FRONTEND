import { redirect } from "next/navigation";

export default function OwnWarehousePage() {
  redirect("/own/account?section=warehouse");
}
