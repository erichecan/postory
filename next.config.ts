import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const TEMPLATE_ASSETS_ORIGIN = "https://storage.googleapis.com/postory-templates";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
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

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
