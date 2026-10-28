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
  serverExternalPackages: ["postgres"],
  // db/schema.sql is read at runtime to create tables on first use
  outputFileTracingIncludes: {
    "/api/**/*": ["./db/schema.sql"],
  },
  // Library, Explorer and Compare depend on the eu-law backend, which is not used anymore.
  async redirects() {
    return ["/library", "/explorer", "/compare"].flatMap((path) => [
      { source: path, destination: "/chat", permanent: false },
      { source: `${path}/:rest*`, destination: "/chat", permanent: false },
    ]);
  },
};

export default withBundleAnalyzer(nextConfig);
