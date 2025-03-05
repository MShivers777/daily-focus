/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static exports
  images: {
    unoptimized: true,
  },
  basePath: '/daily-focus', // Match your repository name
  assetPrefix: '/daily-focus/', // Match your repository name
}

module.exports = nextConfig
