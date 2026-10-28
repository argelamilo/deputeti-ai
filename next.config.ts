import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Removed 'output: export' to enable server-side rendering and API calls
  images: {
    unoptimized: true,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ["better-sqlite3"],
};

export default withBundleAnalyzer(nextConfig);
