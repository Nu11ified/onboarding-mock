import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable standalone output for smaller Docker images & faster cold starts
  output: "standalone",

  // Enable gzip compression
  compress: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Aggressive caching headers for static assets
  headers: async () => [
    {
      source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/_next/static/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/fonts/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Experimental performance features
  experimental: {
    // Optimize package imports to reduce bundle size - only import what's used
    optimizePackageImports: [
      "lucide-react",
      "lodash",
      "recharts",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-accordion",
      "@radix-ui/react-tabs",
      "@radix-ui/react-select",
      "motion",
    ],
    // Enable CSS chunking for better caching - changed styles only invalidate their chunk
    cssChunking: true,
  },
};

export default nextConfig;
