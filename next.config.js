/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'docs', // Changed from outDir to distDir
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/daily-focus' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/daily-focus/' : '',
  trailingSlash: true,
};

module.exports = nextConfig;
