import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const webBaseUrl = "https://take-and-do.com";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          ...(isProd
            ? [{ key: "Access-Control-Allow-Credentials", value: "true" }]
            : []),
          {
            key: "Access-Control-Allow-Origin",
            value: isProd ? webBaseUrl : "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
