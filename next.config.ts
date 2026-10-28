import type { NextConfig } from "next";
import { PRODUCT_IMAGE_REMOTE_PATTERNS } from "./src/config/product-images";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const rewrites: { source: string; destination: string }[] = [];

    const paymentApiBaseUrl = process.env.PAYMENT_API_BASE_URL?.trim();
    if (paymentApiBaseUrl) {
      const target = new URL(paymentApiBaseUrl);
      if (!["http:", "https:"].includes(target.protocol) || target.username || target.password || target.search || target.hash) {
        throw new Error("PAYMENT_API_BASE_URL must be an HTTP(S) base URL without credentials, query or fragment.");
      }
      rewrites.push({
        source: "/hubs/payments/:path*",
        destination: `${paymentApiBaseUrl.replace(/\/+$/, "")}/hubs/payments/:path*`,
      });
    }

    const backendApiBaseUrl = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL)?.trim();
    if (backendApiBaseUrl) {
      const target = new URL(backendApiBaseUrl);
      if (!["http:", "https:"].includes(target.protocol) || target.username || target.password || target.search || target.hash) {
        throw new Error("BACKEND_API_URL or NEXT_PUBLIC_API_URL must be an HTTP(S) base URL without credentials, query or fragment.");
      }
      rewrites.push({
        source: "/hubs/analytics/:path*",
        destination: `${backendApiBaseUrl.replace(/\/+$/, "")}/hubs/analytics/:path*`,
      });
    }

    return rewrites;
  },
  async redirects() {
    return [
      { source: "/products", destination: "/search", permanent: true },
    ];
  },
  images: {
    remotePatterns: PRODUCT_IMAGE_REMOTE_PATTERNS,
    formats: ["image/webp"],
    qualities: [75],
  },
};

export default nextConfig;
