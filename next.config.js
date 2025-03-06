/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/daily-focus',
  assetPrefix: '/daily-focus/',
  trailingSlash: true,
  // Add this to ensure assets are loaded correctly
  webpack: (config) => {
    config.output.publicPath = '/daily-focus/_next/';
    return config;
  },
};

module.exports = nextConfig;
