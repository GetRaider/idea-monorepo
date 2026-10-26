import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/api"],
  async redirects() {
    return [
      {
        source: "/tasks/board/:path*",
        destination: "/planning/space/:path*",
        permanent: true,
      },
      {
        source: "/tasks",
        destination: "/planning",
        permanent: false,
      },
      {
        source: "/tasks/:path*",
        destination: "/planning/:path*",
        permanent: false,
      },
      {
        source: "/docs/goals",
        destination: "/planning/goals",
        permanent: false,
      },
      {
        source: "/docs",
        destination: "/knowledge",
        permanent: false,
      },
      {
        source: "/docs/:path*",
        destination: "/knowledge/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
