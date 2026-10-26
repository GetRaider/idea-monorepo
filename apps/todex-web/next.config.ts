import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/api"],
  async redirects() {
    return [
      {
        source: "/tasks/board/:path*",
        destination: "/tasks/space/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
