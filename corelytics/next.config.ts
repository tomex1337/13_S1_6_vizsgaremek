import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "2mb" }
  },
  typescript: {
    ignoreBuildErrors: true // Temporarily ignore TypeScript errors
  },
  eslint: {
    ignoreDuringBuilds: true // Temporarily ignore ESLint errors
  }
};

export default nextConfig;
