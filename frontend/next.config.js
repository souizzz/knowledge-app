/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        { source: "/api/auth/:path*", destination: "http://localhost:8081/auth/:path*" },
      ];
    },
};

module.exports = nextConfig;
  