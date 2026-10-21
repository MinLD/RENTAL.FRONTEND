import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import { ToastProvider } from "@/providers/toast-provider";
import { TopLoaderProvider } from "@/providers/top-loader-provider";

import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
});

export const metadata: Metadata = {
  title: {
    default: "DPU Rental",
    template: "%s | DPU Rental",
  },
  description: "Nền tảng cho thuê thiết bị công trường của DP Unity.",
  applicationName: "DPU Rental",
  openGraph: {
    title: "DPU Rental",
    description: "Nền tảng cho thuê thiết bị công trường của DP Unity.",
    siteName: "DPU Rental",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={beVietnamPro.variable}>
      <body>
        <TopLoaderProvider />
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
