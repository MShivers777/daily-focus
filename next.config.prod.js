/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/daily-focus',
  assetPrefix: '/daily-focus/',
}

module.exports = nextConfig
