import type { NextConfig } from "next";
import { PRODUCT_IMAGE_REMOTE_PATTERNS } from "./src/config/product-images";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const paymentApiBaseUrl = process.env.PAYMENT_API_BASE_URL?.trim();
    if (!paymentApiBaseUrl) return [];
    const target = new URL(paymentApiBaseUrl);
    if (!["http:", "https:"].includes(target.protocol) || target.username || target.password || target.search || target.hash) {
      throw new Error("PAYMENT_API_BASE_URL must be an HTTP(S) base URL without credentials, query or fragment.");
    }
    return [{
      source: "/api/v1/payment/hubs/payments/:path*",
      destination: `${paymentApiBaseUrl.replace(/\/+$/, "")}/api/v1/payment/hubs/payments/:path*`,
    }];
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
