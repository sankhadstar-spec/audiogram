import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cover images from common CDNs + R2 public buckets
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google profile photos
    ],
  },
};

export default nextConfig;
