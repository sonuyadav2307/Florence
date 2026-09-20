import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Node 22 resolves @swc/helpers to ESM; include it so Vercel lambdas do not 500.
  outputFileTracingIncludes: {
    "*": ["./node_modules/@swc/helpers/esm/**"],
    "/*": ["./node_modules/@swc/helpers/esm/**"],
  },
  async headers() {
    return [
      {
        source: "/projects/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/flowers",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
