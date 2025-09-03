import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // Enable static export
  trailingSlash: true,
  distDir: 'out',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
