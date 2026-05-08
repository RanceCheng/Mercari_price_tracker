import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  devIndicators: false,
  experimental: {
    cpus: 2,
  },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
