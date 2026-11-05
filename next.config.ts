import type { NextConfig } from "next";
import { PRODUCT_IMAGE_REMOTE_PATTERNS } from "./src/config/product-images";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const rewrites = [];

    const paymentApiBaseUrl =
      process.env.PAYMENT_API_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_URL?.trim();
    if (paymentApiBaseUrl) {
      const target = new URL(paymentApiBaseUrl);
      if (!["http:", "https:"].includes(target.protocol) || target.username || target.password || target.search || target.hash) {
        throw new Error("PAYMENT_API_BASE_URL must be an HTTP(S) base URL without credentials, query or fragment.");
      }
      rewrites.push({
        source: "/api/v1/payment/hubs/payments/:path*",
        destination: `${paymentApiBaseUrl.replace(/\/+$/, "")}/api/v1/payment/hubs/payments/:path*`,
      });
    }

    const notificationApiBaseUrl =
      process.env.NOTIFICATION_API_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_URL?.trim();
    if (notificationApiBaseUrl) {
      const target = new URL(notificationApiBaseUrl);
      if (!["http:", "https:"].includes(target.protocol) || target.username || target.password || target.search || target.hash) {
        throw new Error("NOTIFICATION_API_BASE_URL must be an HTTP(S) base URL without credentials, query or fragment.");
      }
      rewrites.push({
        source: "/api/v1/notifications/hubs/inbox/:path*",
        destination: `${notificationApiBaseUrl.replace(/\/+$/, "")}/api/v1/notifications/hubs/inbox/:path*`,
      });
    }

    const analyticsApiBaseUrl =
      process.env.ANALYTICS_API_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_URL?.trim();
    if (analyticsApiBaseUrl) {
      const target = new URL(analyticsApiBaseUrl);
      if (!["http:", "https:"].includes(target.protocol) || target.username || target.password || target.search || target.hash) {
        throw new Error("ANALYTICS_API_BASE_URL must be an HTTP(S) base URL without credentials, query or fragment.");
      }
      rewrites.push({
        source: "/hubs/analytics/:path*",
        destination: `${analyticsApiBaseUrl.replace(/\/+$/, "")}/hubs/analytics/:path*`,
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
