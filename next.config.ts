import type { NextConfig } from "next";

const TEMPLATE_ASSETS_ORIGIN = "https://storage.googleapis.com/postory-templates";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [{ source: "/assets/templates/:path*", destination: `${TEMPLATE_ASSETS_ORIGIN}/:path*` }],
    };
  },
};

export default nextConfig;
