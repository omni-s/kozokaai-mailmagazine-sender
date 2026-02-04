/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['esbuild', 'esbuild-register'],
  // Mantineのツリーシェイキング最適化（webpackキャッシュワーニング対策）
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  webpack: (config, { isServer }) => {
    // node_modules内の不要ファイルをバンドルから除外
    // ignore-loaderで空のモジュールを返す
    config.module.rules.push({
      test: /\.(md|exe|d\.ts)$/,
      include: /node_modules/,
      use: 'ignore-loader',
    });

    // esbuild関連をサーバーサイドで外部化
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('esbuild', 'esbuild-register');
      } else {
        config.externals = [
          config.externals,
          'esbuild',
          'esbuild-register',
        ];
      }
    }

    return config;
  },
};

module.exports = nextConfig;
