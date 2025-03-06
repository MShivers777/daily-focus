/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static exporting
  basePath: '/daily-focus', // Your repository name
  assetPrefix: '/daily-focus/', // Ensures assets are loaded relative to DB Pages URL
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
