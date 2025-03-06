/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  outDir: 'docs', // Changed from distDir to outDir
  images: {
    unoptimized: true,
  },
  basePath: '/daily-focus',
  assetPrefix: '/daily-focus/',
};

module.exports = nextConfig;
