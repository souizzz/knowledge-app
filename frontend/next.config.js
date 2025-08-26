/** @type {import('next').NextConfig} */
const nextConfig = {
    // Vercelではstandaloneは不要
    // output: 'standalone',
    async rewrites() {
      return [
        { source: "/api/auth/:path*", destination: "http://auth:8081/auth/:path*" },
      ];
    },
};

module.exports = nextConfig;
  