import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CartPage } from "@/components/cart/cart-page";
import { CART_ENABLED } from "@/config/features";

export const metadata: Metadata = { title: "Giỏ hàng" };

export default function Page() {
  if (!CART_ENABLED) redirect("/search");
  return <CartPage />;
}
