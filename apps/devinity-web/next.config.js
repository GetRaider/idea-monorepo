/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: ["@repo/ui"],
  compiler: {
    styledComponents: true,
  },
};
