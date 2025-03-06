/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Remove distDir as it's not needed with output: 'export'
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/daily-focus' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/daily-focus/' : '',
  trailingSlash: true,
};

module.exports = nextConfig;
