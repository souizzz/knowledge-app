/** @type {import('next').NextConfig} */
const nextConfig = {
    // Vercelではstandaloneは不要
    // output: 'standalone',
    
    // キャッシュバスティング用の設定
    generateBuildId: async () => {
        return `build-${Date.now()}`;
    },
    
    // APIルートの動的レンダリングを強制
    experimental: {
        serverComponentsExternalPackages: ['@supabase/supabase-js']
    },
    
    // すべてのAPIルートを動的レンダリングに強制
    async rewrites() {
        return [];
    },
    
    // 静的生成を無効化
    trailingSlash: false,
    skipTrailingSlashRedirect: true,
    
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
  