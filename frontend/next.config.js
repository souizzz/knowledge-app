/** @type {import('next').NextConfig} */
const nextConfig = {
    // Vercelではstandaloneは不要
    // output: 'standalone',
    
    // キャッシュバスティング用の設定
    generateBuildId: async () => {
        return `build-${Date.now()}`;
    },
    
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
            // キャッシュ制御ヘッダー
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate',
            },
          ],
        },
      ];
    },
};

module.exports = nextConfig;
  