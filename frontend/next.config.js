/** @type {import('next').NextConfig} */
const nextConfig = {
    // Vercelではstandaloneは不要
    // output: 'standalone',
    
    // CORS設定を追加
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*',
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, POST, PUT, DELETE, OPTIONS',
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'Content-Type, Authorization',
            },
          ],
        },
      ];
    },
};

module.exports = nextConfig;
  