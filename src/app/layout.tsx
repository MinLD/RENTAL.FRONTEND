import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
});

export const metadata: Metadata = {
  title: "DPRENTAL Frontend",
  description: "DPRENTAL frontend application",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={beVietnamPro.variable}>
      <body>{children}</body>
    </html>
  );
}
