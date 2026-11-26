import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/home", destination: "/", statusCode: 301 },
      { source: "/projects", destination: "/products", statusCode: 301 },
      { source: "/projects/:slug", destination: "/products/:slug", statusCode: 301 },
    ];
  },
};

export default nextConfig;
