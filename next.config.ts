import type { NextConfig } from "next";
import { PRODUCT_IMAGE_REMOTE_PATTERNS } from "./src/config/product-images";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: PRODUCT_IMAGE_REMOTE_PATTERNS,
    formats: ["image/webp"],
    qualities: [75],
  },
};

export default nextConfig;
