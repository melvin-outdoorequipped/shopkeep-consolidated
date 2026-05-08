import type { NextConfig } from "next";

const nextConfig = {
  images: {
    unoptimized: true, // This will bypass Next.js image optimization
    // OR configure allowed qualities:
    // qualities: [75, 90, 100],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

export default nextConfig;
