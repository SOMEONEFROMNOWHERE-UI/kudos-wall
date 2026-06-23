import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Vercel-ready
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
