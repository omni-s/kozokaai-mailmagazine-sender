/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['esbuild', 'esbuild-register'],
  webpack: (config, { isServer }) => {
    // node_modules内の特定ファイルを無視（.md, .exe, .d.ts）
    // ignore-loaderを使わず、webpackの標準機能で空のモジュールを返す
    config.module.rules.push({
      test: /\.(md|exe|d\.ts)$/,
      include: /node_modules/,
      use: {
        loader: 'null-loader',
        // null-loaderの代替: 空のモジュールを返すカスタムローダー関数
        // 実際には、webpackの標準機能で空の文字列を返す
      },
    });
    
    // より確実な方法: カスタムローダー関数を直接定義
    // null-loaderが利用できない場合のフォールバック
    const path = require('path');
    config.module.rules.push({
      test: /\.(md|exe|d\.ts)$/,
      include: /node_modules/,
      use: {
        loader: path.resolve(__dirname, 'webpack-ignore-loader.js'),
      },
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
